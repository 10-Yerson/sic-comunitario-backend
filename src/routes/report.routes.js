// src/routes/report.routes.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { auth, authorize } = require('../middleware/authMiddleware');

/**
 * =========================
 * PÚBLICO (sin autenticación)
 * =========================
 */

// Generar PDF público del historial por cédula
router.get('/public/cedula/:cedula', reportController.generatePublicReportByCedula);

/**
 * =========================
 * USER (encargado)
 * =========================
 */

// Generar PDF de MIS eventos (acta o informe)
router.get('/event/:eventId/pdf', auth, authorize('user'), reportController.generateEventPDF);

// Generar reporte general de MIS eventos
router.get('/general', auth, authorize('user'), reportController.generateGeneralReport);

// Ver MI propio reporte de asistencia
router.get('/my-report', auth, authorize('user'), reportController.generateUserReport);

/**
 * =========================
 * ADMIN
 * =========================
 */

// Admin puede hacer todo lo del USER + ver reportes de cualquier usuario
router.get('/admin/event/:eventId/pdf', auth, authorize('admin'), reportController.generateEventPDF);
router.get('/admin/general', auth, authorize('admin'), reportController.generateGeneralReport);
router.get('/admin/user/:userId', auth, authorize('admin'), reportController.generateUserReport);

module.exports = router;