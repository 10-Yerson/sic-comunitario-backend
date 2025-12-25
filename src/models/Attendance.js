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
    
    status: {
        type: String,
        enum: ['asistio', 'falto', 'justificado'],
        default: 'asistio'
    },
    
    arrivalTime: {
        type: String, 
        required: false
    },
    
    departureTime: {
        type: String,
        required: false
    },
    
    justification: {
        type: String,
        required: false
    },
    
    notes: {
        type: String,
        required: false
    },
    
    registeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'registeredByModel', 
        required: true
    },
    registeredByModel: {
        type: String,
        required: true,
        enum: ['User', 'Admin']
    }
}, 
{ timestamps: true });

AttendanceSchema.index({ event: 1, user: 1 }, { unique: true });

AttendanceSchema.index({ user: 1, createdAt: -1 });
AttendanceSchema.index({ event: 1 });

module.exports = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);