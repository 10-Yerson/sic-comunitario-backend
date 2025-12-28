// src/controllers/eventController.js
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

/**
 * Crear un nuevo evento con imagen/video de portada opcional
 */
exports.createEvent = async (req, res) => {
    const { title, description, type, date, startTime, endTime, location, agenda, decisions, observations } = req.body;

    try {
        // Validar tipo de evento
        if (!['reunion', 'trabajo'].includes(type)) {
            return res.status(400).json({ msg: 'Tipo de evento inválido. Debe ser "reunion" o "trabajo"' });
        }

        // Preparar datos del evento
        const eventData = {
            title,
            description,
            type,
            date,
            startTime,
            endTime,
            location,
            organizer: req.user.id,
            agenda: type === 'reunion' ? agenda : undefined,
            decisions: type === 'reunion' ? decisions : undefined,
            observations
        };

        // 👇 Si hay archivo adjunto, subirlo a Cloudinary
        if (req.file) {
            const isVideo = req.file.mimetype.startsWith('video/');
            const isImage = req.file.mimetype.startsWith('image/');
            
            if (isVideo || isImage) {
                const folder = isVideo ? 'Events/videos' : 'Events/images';
                const resourceType = isVideo ? 'video' : 'image';
                
                const result = await uploadToCloudinary(req.file, folder, resourceType);
                
                eventData.media = {
                    url: result.secure_url,
                    publicId: result.public_id,
                    type: isVideo ? 'video' : 'image',
                    metadata: {
                        size: req.file.size,
                        format: result.format,
                        width: result.width,
                        height: result.height,
                        duration: result.duration
                    }
                };
            }
        }

        const newEvent = new Event(eventData);
        await newEvent.save();

        res.status(201).json({
            msg: `${type === 'reunion' ? 'Reunión' : 'Trabajo comunitario'} creado exitosamente`,
            event: newEvent
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor', error: err.message });
    }
};

/**
 * Obtener todos los eventos con filtros
 */
exports.getEvents = async (req, res) => {
    try {
        const { type, status, startDate, endDate } = req.query;

        const filters = {};
        if (type) filters.type = type;
        if (status) filters.status = status;
        if (startDate || endDate) {
            filters.date = {};
            if (startDate) filters.date.$gte = new Date(startDate);
            if (endDate) filters.date.$lte = new Date(endDate);
        }

        const events = await Event.find(filters)
            .populate('organizer', 'name apellido email profilePicture')
            .sort({ date: -1 });

        res.json(events);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

/**
 * Obtener eventos del usuario encargado actual
 */
exports.getMyEvents = async (req, res) => {
    try {
        const { type, status, startDate, endDate } = req.query;
        
        const filters = { organizer: req.user.id };
        
        if (type) filters.type = type;
        if (status) filters.status = status;
        if (startDate || endDate) {
            filters.date = {};
            if (startDate) filters.date.$gte = new Date(startDate);
            if (endDate) filters.date.$lte = new Date(endDate);
        }
        
        const events = await Event.find(filters)
            .populate('organizer', 'name apellido email profilePicture')
            .sort({ date: -1 });
        
        const stats = {
            total: events.length,
            reuniones: events.filter(e => e.type === 'reunion').length,
            trabajos: events.filter(e => e.type === 'trabajo').length,
            programados: events.filter(e => e.status === 'programado').length,
            enCurso: events.filter(e => e.status === 'en_curso').length,
            finalizados: events.filter(e => e.status === 'finalizado').length
        };
        
        res.json({ events, stats });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

/**
 * Obtener un evento por ID con detalles completos
 */
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name apellido email profilePicture');

        if (!event) {
            return res.status(404).json({ msg: 'Evento no encontrado' });
        }

        // Obtener asistencias
        const attendances = await Attendance.find({ event: req.params.id })
            .populate('user', 'name apellido email profilePicture profile.cedula profile.lote')
            .populate('registeredBy', 'name apellido');

        res.json({
            event,
            attendances,
            stats: {
                totalAsistentes: attendances.filter(a => a.status === 'asistio').length,
                totalFaltas: attendances.filter(a => a.status === 'falto').length,
                totalJustificados: attendances.filter(a => a.status === 'justificado').length
            }
        });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID de evento inválido' });
        }
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

/**
 * Actualizar un evento (con opción de cambiar imagen/video)
 */
exports.updateEvent = async (req, res) => {
    const { title, description, date, startTime, endTime, location, agenda, decisions, observations, status } = req.body;

    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Evento no encontrado' });
        }

        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'No autorizado para editar este evento' });
        }

        // Actualizar campos básicos
        if (title) event.title = title;
        if (description) event.description = description;
        if (date) event.date = date;
        if (startTime) event.startTime = startTime;
        if (endTime) event.endTime = endTime;
        if (location) event.location = location;
        if (agenda && event.type === 'reunion') event.agenda = agenda;
        if (decisions && event.type === 'reunion') event.decisions = decisions;
        if (observations) event.observations = observations;
        if (status) event.status = status;

        // 👇 Si hay nuevo archivo, eliminar el anterior y subir el nuevo
        if (req.file) {
            // Eliminar archivo anterior de Cloudinary
            if (event.media && event.media.publicId) {
                await cloudinary.uploader.destroy(event.media.publicId, {
                    resource_type: event.media.type === 'video' ? 'video' : 'image'
                });
            }

            // Subir nuevo archivo
            const isVideo = req.file.mimetype.startsWith('video/');
            const isImage = req.file.mimetype.startsWith('image/');
            
            if (isVideo || isImage) {
                const folder = isVideo ? 'Events/videos' : 'Events/images';
                const resourceType = isVideo ? 'video' : 'image';
                
                const result = await uploadToCloudinary(req.file, folder, resourceType);
                
                event.media = {
                    url: result.secure_url,
                    publicId: result.public_id,
                    type: isVideo ? 'video' : 'image',
                    metadata: {
                        size: req.file.size,
                        format: result.format,
                        width: result.width,
                        height: result.height,
                        duration: result.duration
                    }
                };
            }
        }

        await event.save();

        res.json({ msg: 'Evento actualizado exitosamente', event });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

/**
 * Eliminar imagen/video de un evento
 */
exports.deleteEventMedia = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Evento no encontrado' });
        }

        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'No autorizado' });
        }

        if (!event.media || !event.media.publicId) {
            return res.status(400).json({ msg: 'El evento no tiene imagen/video' });
        }

        // Eliminar de Cloudinary
        await cloudinary.uploader.destroy(event.media.publicId, {
            resource_type: event.media.type === 'video' ? 'video' : 'image'
        });

        // Limpiar campo media
        event.media = undefined;
        await event.save();

        res.json({ msg: 'Imagen/video eliminado exitosamente', event });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

/**
 * Eliminar un evento y todos sus datos relacionados
 */
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Evento no encontrado' });
        }

        // Eliminar imagen/video de Cloudinary si existe
        if (event.media && event.media.publicId) {
            await cloudinary.uploader.destroy(event.media.publicId, {
                resource_type: event.media.type === 'video' ? 'video' : 'image'
            });
        }

        // Eliminar asistencias
        await Attendance.deleteMany({ event: req.params.id });

        // Eliminar evento
        await event.deleteOne();

        res.json({ msg: 'Evento eliminado exitosamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

/**
 * Cambiar estado del evento
 */
exports.changeEventStatus = async (req, res) => {
    const { status } = req.body;

    try {
        const validStatus = ['programado', 'en_curso', 'finalizado', 'cancelado'];
        if (!validStatus.includes(status)) {
            return res.status(400).json({ msg: 'Estado inválido' });
        }

        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Evento no encontrado' });
        }

        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'No autorizado para cambiar el estado' });
        }

        if (event.status === 'finalizado') {
            return res.status(400).json({ msg: 'Evento ya finalizado' });
        }

        event.status = status;
        await event.save();

        res.json({ msg: 'Estado actualizado exitosamente', event });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

/**
 * Función auxiliar para subir a Cloudinary
 */
const uploadToCloudinary = (file, folder, resourceType) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { 
                folder,
                resource_type: resourceType,
                allowed_formats: resourceType === 'video' 
                    ? ['mp4', 'avi', 'mov', 'wmv', 'mkv']
                    : ['jpg', 'jpeg', 'png', 'gif', 'webp']
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);
        bufferStream.pipe(stream);
    });
};

/**
 * Obtener TODOS los eventos (PÚBLICO - Sin autenticación)
 */
exports.getPublicEvents = async (req, res) => {
    try {
        const { type, status } = req.query;
        
        const filters = {};
        if (type) filters.type = type;
        if (status) filters.status = status;
        
        // Excluir eventos cancelados por defecto
        if (!status) filters.status = { $ne: 'cancelado' };
        
        const events = await Event.find(filters)
            .select('title description type date startTime endTime location media status')
            .populate('organizer', 'name apellido')
            .sort({ date: -1 })
            .limit(100);
        
        res.json({
            total: events.length,
            eventos: events.map(e => ({
                id: e._id,
                titulo: e.title,
                descripcion: e.description,
                tipo: e.type,
                fecha: new Date(e.date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                horaInicio: e.startTime,
                horaFin: e.endTime || 'N/A',
                lugar: e.location,
                estado: e.status,
                imagen: e.media && e.media.url ? e.media.url : null,
                tipoImagen: e.media && e.media.type ? e.media.type : null,
                organizador: e.organizer ? `${e.organizer.name} ${e.organizer.apellido || ''}` : 'N/A',
                createdAt: e.createdAt
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

/**
 * Obtener detalles de cualquier evento (PÚBLICO)
 */
exports.getPublicEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name apellido');
        
        if (!event) {
            return res.status(404).json({ msg: 'Evento no encontrado' });
        }
        
        if (event.status === 'cancelado') {
            return res.status(403).json({ msg: 'Este evento ha sido cancelado' });
        }
        
        const attendances = await Attendance.find({ event: req.params.id });
        
        res.json({
            evento: {
                id: event._id,
                titulo: event.title,
                descripcion: event.description,
                tipo: event.type,
                fecha: new Date(event.date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                horaInicio: event.startTime,
                horaFin: event.endTime || 'N/A',
                lugar: event.location,
                estado: event.status,
                imagen: event.media && event.media.url ? event.media.url : null,
                tipoImagen: event.media && event.media.type ? event.media.type : null,
                organizador: event.organizer ? `${event.organizer.name} ${event.organizer.apellido || ''}` : 'N/A',
                agenda: event.agenda || [],
                decisions: event.decisions || [],
                observaciones: event.observations || '',
                createdAt: event.createdAt
            },
            participacion: {
                totalParticipantes: attendances.filter(a => a.status === 'asistio').length,
                totalRegistrados: attendances.length
            }
        });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID de evento inválido' });
        }
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

/**
 * Agregar/actualizar decisiones de una reunión
 */
exports.updateDecisions = async (req, res) => {
    const { decisions } = req.body;

    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Evento no encontrado' });
        }

        if (event.type !== 'reunion') {
            return res.status(400).json({ msg: 'Solo las reuniones pueden tener decisiones' });
        }

        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'No autorizado para editar esta reunión' });
        }

        // Validar formato de decisiones
        if (!Array.isArray(decisions)) {
            return res.status(400).json({ msg: 'Las decisiones deben ser un array' });
        }

        // Validar cada decisión
        for (const item of decisions) {
            if (!item.decision || typeof item.decision !== 'string') {
                return res.status(400).json({ msg: 'Cada decisión debe tener un campo "decision" válido' });
            }
        }

        event.decisions = decisions;
        await event.save();

        res.json({ 
            msg: 'Decisiones actualizadas exitosamente', 
            event 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor', error: err.message });
    }
};

/**
 * Agregar decisión individual
 */
exports.addDecision = async (req, res) => {
    const { decision, responsable } = req.body;

    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Evento no encontrado' });
        }

        if (event.type !== 'reunion') {
            return res.status(400).json({ msg: 'Solo las reuniones pueden tener decisiones' });
        }

        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'No autorizado' });
        }

        if (!decision || decision.trim() === '') {
            return res.status(400).json({ msg: 'La decisión es requerida' });
        }

        event.decisions.push({ decision, responsable: responsable || '' });
        await event.save();

        res.json({ 
            msg: 'Decisión agregada exitosamente', 
            decisions: event.decisions 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

/**
 * Eliminar decisión
 */
exports.removeDecision = async (req, res) => {
    const { itemId } = req.params;

    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Evento no encontrado' });
        }

        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'No autorizado' });
        }

        event.decisions = event.decisions.filter(item => item._id.toString() !== itemId);
        await event.save();

        res.json({ 
            msg: 'Decisión eliminada exitosamente', 
            decisions: event.decisions 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};