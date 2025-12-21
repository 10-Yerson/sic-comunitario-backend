// src/controllers/reportController.js
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const { generateActa, generateInforme } = require('../utils/pdfGenerator');

/**
 * Generar PDF de un evento (acta o informe)
 * USER solo de SUS eventos, ADMIN de todos
 */
exports.generateEventPDF = async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId)
            .populate('organizer', 'name apellido');
        
        if (!event) {
            return res.status(404).json({ msg: 'Evento no encontrado' });
        }
        
        // 👇 VALIDAR PERMISOS
        if (req.user.role === 'user' && event.organizer._id.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Solo puedes generar PDFs de tus eventos' });
        }
        
        // Obtener asistencias
        const attendances = await Attendance.find({ event: req.params.eventId })
            .populate('user', 'name apellido email profile.cedula profile.lote');
        
        let pdfBuffer;
        
        if (event.type === 'reunion') {
            // Generar ACTA
            pdfBuffer = await generateActa(event, attendances);
        } else {
            // Generar INFORME (el evento ya tiene su imagen/video en event.media)
            pdfBuffer = await generateInforme(event, attendances);
        }
        
        // Enviar PDF
        const tipo = event.type === 'reunion' ? 'Acta' : 'Informe';
        const filename = `${tipo}_${event.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error generando PDF', error: err.message });
    }
};

/**
 * Generar reporte general de eventos
 * USER solo de SUS eventos, ADMIN de todos
 */
exports.generateGeneralReport = async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;
        
        // Construir filtros
        const filters = {};
        
        // 👇 USER solo ve sus eventos, ADMIN ve todos
        if (req.user.role === 'user') {
            filters.organizer = req.user.id;
        }
        
        if (type) filters.type = type;
        if (startDate || endDate) {
            filters.date = {};
            if (startDate) filters.date.$gte = new Date(startDate);
            if (endDate) filters.date.$lte = new Date(endDate);
        }
        
        // Obtener eventos
        const events = await Event.find(filters).populate('organizer', 'name apellido');
        
        // Estadísticas generales
        const stats = {
            totalEventos: events.length,
            reuniones: events.filter(e => e.type === 'reunion').length,
            trabajos: events.filter(e => e.type === 'trabajo').length,
            programados: events.filter(e => e.status === 'programado').length,
            enCurso: events.filter(e => e.status === 'en_curso').length,
            finalizados: events.filter(e => e.status === 'finalizado').length,
            cancelados: events.filter(e => e.status === 'cancelado').length
        };
        
        // Obtener total de asistencias
        const eventIds = events.map(e => e._id);
        const totalAttendances = await Attendance.countDocuments({
            event: { $in: eventIds },
            status: 'asistio'
        });
        
        // Promedio de asistentes por evento
        const avgAttendance = events.length > 0 ? (totalAttendances / events.length).toFixed(2) : 0;
        
        res.json({
            period: {
                start: startDate || 'Inicio',
                end: endDate || 'Actual'
            },
            stats,
            totalAttendances,
            avgAttendance,
            events: events.map(e => ({
                id: e._id,
                title: e.title,
                type: e.type,
                date: e.date,
                status: e.status,
                organizer: e.organizer ? `${e.organizer.name} ${e.organizer.apellido || ''}` : 'N/A',
                hasMedia: e.media && e.media.url ? true : false
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error generando reporte', error: err.message });
    }
};

/**
 * Generar reporte de asistencia de un usuario específico
 * Cualquier USER puede ver su propio reporte, ADMIN puede ver de todos
 */
exports.generateUserReport = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // 👇 VALIDAR PERMISOS
        if (req.user.role === 'user' && userId !== req.user.id) {
            return res.status(403).json({ msg: 'Solo puedes ver tu propio reporte' });
        }
        
        const attendances = await Attendance.find({ user: userId })
            .populate('event', 'title type date startTime location organizer')
            .populate({
                path: 'event',
                populate: {
                    path: 'organizer',
                    select: 'name apellido'
                }
            });
        
        const stats = {
            totalEventos: attendances.length,
            reuniones: attendances.filter(a => a.event.type === 'reunion').length,
            trabajos: attendances.filter(a => a.event.type === 'trabajo').length,
            asistencias: attendances.filter(a => a.status === 'asistio').length,
            faltas: attendances.filter(a => a.status === 'falto').length,
            justificadas: attendances.filter(a => a.status === 'justificado').length,
            porcentajeAsistencia: attendances.length > 0 
                ? ((attendances.filter(a => a.status === 'asistio').length / attendances.length) * 100).toFixed(2)
                : 0
        };
        
        res.json({
            userId,
            stats,
            attendances: attendances.map(a => ({
                eventId: a.event._id,
                eventTitle: a.event.title,
                eventType: a.event.type,
                eventDate: a.event.date,
                status: a.status,
                arrivalTime: a.arrivalTime,
                departureTime: a.departureTime,
                organizer: a.event.organizer ? `${a.event.organizer.name} ${a.event.organizer.apellido || ''}` : 'N/A'
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error generando reporte', error: err.message });
    }
};