// src/routes/resident.routes.js (NUEVO ARCHIVO)
const express = require('express');
const router = express.Router();
const residentController = require('../controllers/residentController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Listar todos los residentes (solo admin)
router.get('/', auth, authorize('admin'), residentController.getResidents);

// Buscar residente por cédula (admin o user encargado)
router.get('/cedula/:cedula', auth, authorize('admin', 'user'), residentController.getResidentByCedula);

// Ver residente por ID (admin o user encargado)
router.get('/:id', auth, authorize('admin', 'user'), residentController.getResidentById);

// Actualizar residente (solo admin)
router.put('/:id', auth, authorize('admin'), residentController.updateResident);

// Eliminar residente (solo admin)
router.delete('/:id', auth, authorize('admin'), residentController.deleteResident);

module.exports = router;