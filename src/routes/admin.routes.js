const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/authMiddleware');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Rutas para administradores
router.get('/profile/me', auth, authorize('admin'), adminController.getMyProfile);
router.get('/', auth, authorize('admin'), adminController.getAdmin); 
router.get('/:id', auth, authorize('admin'), adminController.getAdminById); 
router.put('/:id', auth, authorize('admin'), adminController.updateAdmin);
router.delete('/:id', auth, authorize('admin'), adminController.deleteAdmin);

// Ruta para actualizar la imagen de perfilz
router.put('/profile/me', auth, authorize('admin'), upload.single('profileUrl'), adminController.uploadProfilePicture);
module.exports = router;
