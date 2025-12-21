// src/models/Attendance.js - Registro de asistencia/participación
const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resident',
        required: true
    },
    
    // Estado de asistencia
    status: {
        type: String,
        enum: ['asistio', 'falto', 'justificado'],
        default: 'asistio'
    },
    
    // Hora de llegada (opcional)
    arrivalTime: {
        type: String, // Formato: "14:35"
        required: false
    },
    
    // Hora de salida (opcional)
    departureTime: {
        type: String,
        required: false
    },
    
    // Justificación si faltó
    justification: {
        type: String,
        required: false
    },
    
    // Observaciones adicionales
    notes: {
        type: String,
        required: false
    },
    
    // 👇 CAMBIO: Puede ser registrado por USER (encargado del evento) o ADMIN
    registeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'registeredByModel', // Referencia dinámica
        required: true
    },
    registeredByModel: {
        type: String,
        required: true,
        enum: ['User', 'Admin']
    }
}, 
{ timestamps: true });

// Índice compuesto para evitar duplicados
AttendanceSchema.index({ event: 1, user: 1 }, { unique: true });

// Índices para consultas
AttendanceSchema.index({ user: 1, createdAt: -1 });
AttendanceSchema.index({ event: 1 });

module.exports = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);