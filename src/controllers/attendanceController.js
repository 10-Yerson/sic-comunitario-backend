// src/controllers/attendanceController.js
const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const Resident = require('../models/Resident');

/**
 * Registrar asistencia de un RESIDENTE a un evento
 * USER puede registrar en SUS eventos, ADMIN en cualquiera
 */
exports.registerAttendance = async (req, res) => {
    const { eventId, residentId, status, arrivalTime, departureTime, justification, notes } = req.body;
    
    try {
        // Verificar que el evento existe
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Evento no encontrado' });
        }
        
        // VALIDAR PERMISOS: Solo el organizador o admin pueden registrar
        if (req.user.role === 'user' && event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Solo puedes registrar asistencia en tus eventos' });
        }
        
        // Verificar que el residente existe
        const resident = await Resident.findById(residentId);
        if (!resident) {
            return res.status(404).json({ msg: 'Residente no encontrado' });
        }
        
        // Verificar si ya existe un registro de asistencia
        const existingAttendance = await Attendance.findOne({ event: eventId, user: residentId });
        if (existingAttendance) {
            return res.status(400).json({ msg: 'Ya existe un registro de asistencia para este residente en este evento' });
        }
        
        const attendance = new Attendance({
            event: eventId,
            user: residentId,
            status: status || 'asistio',
            arrivalTime,
            departureTime,
            justification,
            notes,
            registeredBy: req.user.id,
            registeredByModel: req.user.role === 'admin' ? 'Admin' : 'User'
        });
        
        await attendance.save();
        
        res.status(201).json({ msg: 'Asistencia registrada exitosamente', attendance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor', error: err.message });
    }
};

/**
 * Registrar asistencia masiva (múltiples residentes)
 * Ahora actualiza si ya existe en lugar de rechazar
 */
exports.registerBulkAttendance = async (req, res) => {
    const { eventId, attendances } = req.body;
    
    try {
        // Verificar que el evento existe
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Evento no encontrado' });
        }
        
        // VALIDAR PERMISOS
        if (req.user.role === 'user' && event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Solo puedes registrar asistencia en tus eventos' });
        }
        
        const results = {
            created: [],
            updated: [],
            errors: []
        };
        
        // 🔍 DEBUG
        console.log(`\n📊 Procesando ${attendances.length} asistencias para evento: ${eventId}`);
        
        for (const att of attendances) {
            try {
                console.log(`\n👤 Residente: ${att.residentId} | Status: "${att.status}"`);
                
                // Verificar si ya existe
                const existing = await Attendance.findOne({ 
                    event: eventId, 
                    user: att.residentId 
                });
                
                if (existing) {
                    // ✅ ACTUALIZAR el registro existente
                    console.log(`   ⚠️  Ya existe, actualizando...`);
                    
                    existing.status = att.status || 'asistio';
                    existing.arrivalTime = att.arrivalTime || existing.arrivalTime;
                    existing.departureTime = att.departureTime || existing.departureTime;
                    existing.justification = att.justification || '';
                    existing.notes = att.notes || existing.notes;
                    existing.registeredBy = req.user.id;
                    existing.registeredByModel = req.user.role === 'admin' ? 'Admin' : 'User';
                    
                    await existing.save();
                    
                    console.log(`   ✅ Actualizado: status="${existing.status}"`);
                    results.updated.push({
                        residentId: att.residentId,
                        status: existing.status
                    });
                    
                } else {
                    // ✅ CREAR nuevo registro
                    console.log(`   🆕 Creando nuevo registro...`);
                    
                    const attendance = new Attendance({
                        event: eventId,
                        user: att.residentId,
                        status: att.status || 'asistio',
                        arrivalTime: att.arrivalTime,
                        departureTime: att.departureTime,
                        justification: att.justification,
                        notes: att.notes,
                        registeredBy: req.user.id,
                        registeredByModel: req.user.role === 'admin' ? 'Admin' : 'User'
                    });
                    
                    await attendance.save();
                    
                    console.log(`   ✅ Creado: status="${attendance.status}"`);
                    results.created.push({
                        residentId: att.residentId,
                        status: attendance.status
                    });
                }
                
            } catch (err) {
                console.error(`   ❌ Error: ${err.message}`);
                results.errors.push({ 
                    residentId: att.residentId, 
                    msg: err.message 
                });
            }
        }
        
        // 📊 Resumen final
        console.log(`\n📋 RESUMEN FINAL:`);
        console.log(`   🆕 Creados: ${results.created.length}`);
        console.log(`   🔄 Actualizados: ${results.updated.length}`);
        console.log(`   ❌ Errores: ${results.errors.length}`);
        
        // Verificar lo que quedó guardado en la BD
        const finalCount = await Attendance.countDocuments({ event: eventId });
        console.log(`   💾 Total en BD: ${finalCount}\n`);
        
        res.json({ 
            msg: 'Proceso completado',
            created: results.created.length,
            updated: results.updated.length,
            errors: results.errors.length,
            total: results.created.length + results.updated.length,
            details: results
        });
        
    } catch (err) {
        console.error('❌ Error del servidor:', err);
        res.status(500).json({ 
            msg: 'Error del servidor', 
            error: err.message 
        });
    }
};

/**
 * Obtener asistencias de un evento específico
 * USER solo de SUS eventos, ADMIN de todos
 */
exports.getEventAttendances = async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Evento no encontrado' });
        }
        
        // VALIDAR PERMISOS
        if (req.user.role === 'user' && event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Solo puedes ver asistencias de tus eventos' });
        }
        
        const attendances = await Attendance.find({ event: req.params.eventId })
            .populate('user', 'name apellido email cedula lote profilePicture')
            .populate('registeredBy', 'name apellido')
            .sort({ createdAt: -1 });
        
        // Estadísticas
        const stats = {
            total: attendances.length,
            asistio: attendances.filter(a => a.status === 'asistio').length,
            falto: attendances.filter(a => a.status === 'falto').length,
            justificado: attendances.filter(a => a.status === 'justificado').length
        };
        
        res.json({ attendances, stats });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

/**
 * Obtener historial de asistencia de un residente por ID
 * ADMIN puede ver todos
 */
exports.getUserAttendanceHistory = async (req, res) => {
    try {
        const attendances = await Attendance.find({ user: req.params.userId })
            .populate('event', 'title type date startTime location status')
            .populate('registeredBy', 'name apellido')
            .sort({ createdAt: -1 });
        
        // Estadísticas del residente
        const stats = {
            totalEventos: attendances.length,
            asistencias: attendances.filter(a => a.status === 'asistio').length,
            faltas: attendances.filter(a => a.status === 'falto').length,
            justificadas: attendances.filter(a => a.status === 'justificado').length,
            porcentajeAsistencia: attendances.length > 0 
                ? ((attendances.filter(a => a.status === 'asistio').length / attendances.length) * 100).toFixed(2)
                : 0
        };
        
        res.json({ attendances, stats });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

/**
 * Actualizar un registro de asistencia
 * USER solo en SUS eventos, ADMIN en todos
 */
exports.updateAttendance = async (req, res) => {
    const { status, arrivalTime, departureTime, justification, notes } = req.body;
    
    try {
        const attendance = await Attendance.findById(req.params.id).populate('event');
        
        if (!attendance) {
            return res.status(404).json({ msg: 'Registro de asistencia no encontrado' });
        }
        
        // VALIDAR PERMISOS
        if (req.user.role === 'user' && attendance.event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Solo puedes actualizar asistencias de tus eventos' });
        }
        
        if (status) attendance.status = status;
        if (arrivalTime) attendance.arrivalTime = arrivalTime;
        if (departureTime) attendance.departureTime = departureTime;
        if (justification) attendance.justification = justification;
        if (notes !== undefined) attendance.notes = notes;
        
        await attendance.save();
        
        res.json({ msg: 'Asistencia actualizada exitosamente', attendance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

/**
 * Eliminar un registro de asistencia
 * Solo ADMIN puede eliminar
 */
exports.deleteAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.findById(req.params.id);
        
        if (!attendance) {
            return res.status(404).json({ msg: 'Registro de asistencia no encontrado' });
        }
        
        await attendance.deleteOne();
        
        res.json({ msg: 'Asistencia eliminada exitosamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

/**
 * Eliminar TODAS las asistencias de un evento
 * Útil para resetear y volver a registrar
 */
exports.deleteEventAttendances = async (req, res) => {
    try {
        const { eventId } = req.params;
        
        // Verificar que el evento existe
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Evento no encontrado' });
        }
        
        // VALIDAR PERMISOS
        if (req.user.role === 'user' && event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Solo puedes eliminar asistencias de tus eventos' });
        }
        
        // Eliminar todas las asistencias del evento
        const result = await Attendance.deleteMany({ event: eventId });
        
        console.log(`🗑️  Eliminadas ${result.deletedCount} asistencias del evento ${eventId}`);
        
        res.json({ 
            msg: 'Asistencias eliminadas correctamente',
            deleted: result.deletedCount
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al eliminar asistencias' });
    }
};

/**
 * Obtener historial de asistencia por CÉDULA
 * PÚBLICO - No requiere autenticación
 */
exports.getUserAttendanceHistoryByCedula = async (req, res) => {
    try {
        const { cedula } = req.params;
        
        // Validar que la cédula no esté vacía
        if (!cedula || cedula.trim() === '') {
            return res.status(400).json({ msg: 'La cédula es requerida' });
        }
        
        // Buscar residente por cédula
        const resident = await Resident.findOne({ cedula: cedula.trim() });
        
        if (!resident) {
            return res.status(404).json({ 
                msg: 'No se encontró ningún residente con esa cédula',
                cedula: cedula
            });
        }
        
        // Obtener historial de asistencias
        const attendances = await Attendance.find({ user: resident._id })
            .populate('event', 'title type date startTime endTime location status media')
            .populate({
                path: 'event',
                populate: {
                    path: 'organizer',
                    select: 'name apellido'
                }
            })
            .sort({ createdAt: -1 });
        
        // Estadísticas del residente
        const stats = {
            totalEventos: attendances.length,
            reuniones: attendances.filter(a => a.event && a.event.type === 'reunion').length,
            trabajos: attendances.filter(a => a.event && a.event.type === 'trabajo').length,
            asistencias: attendances.filter(a => a.status === 'asistio').length,
            faltas: attendances.filter(a => a.status === 'falto').length,
            justificadas: attendances.filter(a => a.status === 'justificado').length,
            porcentajeAsistencia: attendances.length > 0 
                ? ((attendances.filter(a => a.status === 'asistio').length / attendances.length) * 100).toFixed(2)
                : 0
        };
        
        res.json({ 
            residente: {
                nombre: `${resident.name} ${resident.apellido}`,
                cedula: resident.cedula,
                lote: resident.lote || 'No asignado',
                email: resident.email || 'No registrado'
            },
            stats,
            historial: attendances.map(a => ({
                evento: {
                    id: a.event._id,
                    titulo: a.event.title,
                    tipo: a.event.type,
                    fecha: new Date(a.event.date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    horaInicio: a.event.startTime,
                    horaFin: a.event.endTime || 'N/A',
                    lugar: a.event.location,
                    estado: a.event.status,
                    imagen: a.event.media && a.event.media.url ? a.event.media.url : null,
                    organizador: a.event.organizer ? `${a.event.organizer.name} ${a.event.organizer.apellido || ''}` : 'N/A'
                },
                asistencia: {
                    estado: a.status,
                    horaLlegada: a.arrivalTime || 'N/A',
                    horaSalida: a.departureTime || 'N/A',
                    observaciones: a.notes || 'Sin observaciones',
                    justificacion: a.justification || null
                },
                fechaRegistro: a.createdAt
            }))
        });
    } catch (err) {
        console.error('Error al consultar historial por cédula:', err);
        res.status(500).json({ msg: 'Error del servidor', error: err.message });
    }
};