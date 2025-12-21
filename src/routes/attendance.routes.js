// src/routes/attendance.routes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { auth, authorize } = require('../middleware/authMiddleware');


// USER (encargado)
 
// Registrar asistencia en MIS eventos
router.post('/', auth, authorize('user'), attendanceController.registerAttendance);

// Registrar asistencia masiva en MIS eventos
router.post('/bulk', auth, authorize('user'), attendanceController.registerBulkAttendance);

// Ver asistencias de MIS eventos
router.get('/event/:eventId', auth, authorize('user'), attendanceController.getEventAttendances);

// Ver MI propio historial
router.get('/my-history', auth, authorize('user'), attendanceController.getUserAttendanceHistory);

// Actualizar asistencia en MIS eventos
router.put('/:id', auth, authorize('user'), attendanceController.updateAttendance);


// ADMIN

// Admin puede hacer todo lo del USER + eliminar
router.post('/admin', auth, authorize('admin'), attendanceController.registerAttendance);
router.post('/admin/bulk', auth, authorize('admin'), attendanceController.registerBulkAttendance);
router.get('/admin/event/:eventId', auth, authorize('admin'), attendanceController.getEventAttendances);
router.get('/admin/user/:userId', auth, authorize('admin'), attendanceController.getUserAttendanceHistory);
router.put('/admin/:id', auth, authorize('admin'), attendanceController.updateAttendance);

// Solo admin puede eliminar
router.delete('/:id', auth, authorize('admin'), attendanceController.deleteAttendance);

module.exports = router;