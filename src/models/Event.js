const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['reunion', 'trabajo'],
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String
    },
    location: {
        type: String,
        required: true
    },

    // Organizador (USER encargado)
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // 👇 NUEVO: Imagen o video de portada (opcional)
    media: {
        url: {
            type: String,
            required: false
        },
        publicId: {
            type: String,
            required: false
        },
        type: {
            type: String,
            enum: ['image', 'video'],
            required: false
        },
        metadata: {
            size: Number,
            format: String,
            width: Number,
            height: Number,
            duration: Number // Para videos
        }
    },

    // Agenda (solo para reuniones)
    agenda: [{
        punto: String,
        descripcion: String
    }],

    // Decisiones (solo para reuniones)
    decisions: [{
        decision: String,
        responsable: String
    }],

    observations: {
        type: String,
        default: ''
    },

    status: {
        type: String,
        enum: ['programado', 'en_curso', 'finalizado', 'cancelado'],
        default: 'programado'
    }
}, 
{ timestamps: true });

EventSchema.index({ type: 1, date: -1 });
EventSchema.index({ status: 1 });

module.exports = mongoose.models.Event || mongoose.model('Event', EventSchema);