// src/models/User.js - VERSIÓN ADAPTADA PARA SIC
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    apellido: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String,
        default: 'https://res.cloudinary.com/dbgj8dqup/image/upload/v1743182322/uploads/ixv6tw8jfbhykflcmyex.png'
    },
    
    // Información personal básica
    profile: {
        cedula: {
            type: String,
            required: false,
            unique: true,
            sparse: true // Permite múltiples valores null
        },
        fechaNacimiento: {
            type: Date,
            required: false
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
        // Lote o casa donde vive en la comunidad
        lote: {
            type: String,
            required: false
        }
    },
    
    role: {
        type: String,
        enum: ['user'],
        default: 'user'
    },
    
    // Estado del usuario
    isActive: {
        type: Boolean,
        default: true
    }
}, 
{ timestamps: true });

// Encriptar contraseña antes de guardar el usuario
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(8);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('User', UserSchema);