// src/routes/event.routes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { auth, authorize } = require('../middleware/authMiddleware');
const upload = require('../config/multer');


// 🌐 RUTAS PÚBLICAS (Sin autenticación)
 
// Ver detalle de cualquier evento (público)
router.get('/public/:id', eventController.getPublicEventById);

// Ver TODOS los eventos (público)
router.get('/public', eventController.getPublicEvents);


// USER (encargado)

// Crear evento con imagen/video opcional
router.post('/', auth,authorize('user'), upload.single('media'),eventController.createEvent);

// Ver MIS eventos
router.get('/my', auth, authorize('user'), eventController.getMyEvents);

// Actualizar MI evento (puede incluir nuevo archivo)
router.put('/:id',auth, authorize('user'), 
    upload.single('media'), // 👈 Opcional: cambiar imagen/video
    eventController.updateEvent
);

// Eliminar imagen/video de MI evento
router.delete('/:id/media', auth, authorize('user'), eventController.deleteEventMedia);

// Cambiar estado de MI evento
router.patch('/:id/status', auth, authorize('user'), eventController.changeEventStatus);


// ADMIN

// Ver TODOS los eventos
router.get('/', auth, authorize('admin'), eventController.getEvents);

// Ver evento por ID (admin y user)
router.get('/:id', auth, authorize('admin', 'user'), eventController.getEventById);

// Eliminar evento (solo admin)
router.delete('/:id', auth, authorize('admin'), eventController.deleteEvent);

module.exports = router;