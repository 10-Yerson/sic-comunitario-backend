const mongoose = require('mongoose');

const ResidentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    apellido: {
        type: String,
        required: true
    },
    cedula: {
        type: String,
        required: true,
        unique: true,
        index: true 
    },
    email: {
        type: String,
        required: false, 
        sparse: true 
    },
    fechaNacimiento: {
        type: Date,
        required: true
    },
    genero: {
        type: String,
        enum: ['Masculino', 'Femenino', 'Otro'],
        required: true
    },
    telefono: {
        type: String,
        required: false
    },
    direccion: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: false,  
        default: 'sin-acceso-123' 
    },
    lote: {
        type: String,
        required: false
    },
    profilePicture: {
        type: String,
        default: 'https://res.cloudinary.com/dbgj8dqup/image/upload/v1743182322/uploads/ixv6tw8jfbhykflcmyex.png'
    },
    isActive: {
        type: Boolean,
        default: true
    }
},
    { timestamps: true });

// Índice para búsquedas rápidas
ResidentSchema.index({ cedula: 1 });
ResidentSchema.index({ name: 1, apellido: 1 });

module.exports = mongoose.models.Resident || mongoose.model('Resident', ResidentSchema);