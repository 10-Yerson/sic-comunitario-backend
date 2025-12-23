// src/routes/import.routes.js
const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const { auth, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');

// Configuración de multer para archivos Excel
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { 
        fileSize: 5 * 1024 * 1024 // 5MB máximo
    },
    fileFilter: (req, file, cb) => {
        const validMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel' // .xls
        ];
        if (validMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
        }
    }
});

// Importar usuarios desde Excel (solo admin)
router.post('/users', auth, authorize('admin'), upload.single('file'), importController.importUsers);

// Descargar plantilla de Excel (solo admin)
router.get('/template', auth, authorize('admin'), importController.downloadTemplate);

module.exports = router;