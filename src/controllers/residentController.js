// src/controllers/residentController.js (NUEVO ARCHIVO)
const Resident = require('../models/Resident');

exports.getResidents = async (req, res) => {
    try {
        const { search } = req.query;
        
        const filters = {};
        if (search) {
            filters.$or = [
                { name: { $regex: search, $options: 'i' } },
                { apellido: { $regex: search, $options: 'i' } },
                { cedula: { $regex: search, $options: 'i' } }
            ];
        }
        
        const residents = await Resident.find(filters).sort({ name: 1 });
        res.json(residents);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

exports.getResidentByCedula = async (req, res) => {
    try {
        const resident = await Resident.findOne({ cedula: req.params.cedula });
        
        if (!resident) {
            return res.status(404).json({ msg: 'Residente no encontrado' });
        }
        
        res.json(resident);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

exports.getResidentById = async (req, res) => {
    try {
        const resident = await Resident.findById(req.params.id);
        
        if (!resident) {
            return res.status(404).json({ msg: 'Residente no encontrado' });
        }
        
        res.json(resident);
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID inválido' });
        }
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

exports.updateResident = async (req, res) => {
    const { name, apellido, email, cedula, fechaNacimiento, genero, telefono, direccion, lote } = req.body;
    
    try {
        const resident = await Resident.findById(req.params.id);
        
        if (!resident) {
            return res.status(404).json({ msg: 'Residente no encontrado' });
        }
        
        if (name) resident.name = name;
        if (apellido) resident.apellido = apellido;
        if (email) resident.email = email;
        if (cedula) resident.cedula = cedula;
        if (fechaNacimiento) resident.fechaNacimiento = fechaNacimiento;
        if (genero) resident.genero = genero;
        if (telefono) resident.telefono = telefono;
        if (direccion) resident.direccion = direccion;
        if (lote) resident.lote = lote;
        
        await resident.save();
        
        res.json({ msg: 'Residente actualizado exitosamente', resident });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

exports.deleteResident = async (req, res) => {
    try {
        const resident = await Resident.findById(req.params.id);
        
        if (!resident) {
            return res.status(404).json({ msg: 'Residente no encontrado' });
        }
        
        // Verificar si tiene asistencias registradas
        const Attendance = require('../models/Attendance');
        const hasAttendances = await Attendance.findOne({ user: req.params.id });
        
        if (hasAttendances) {
            return res.status(400).json({ msg: 'No se puede eliminar: el residente tiene asistencias registradas' });
        }
        
        await resident.deleteOne();
        
        res.json({ msg: 'Residente eliminado exitosamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};