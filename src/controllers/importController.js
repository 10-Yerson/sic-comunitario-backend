// src/controllers/importController.js
const Resident = require('../models/Resident'); // 👈 Cambiar de User a Resident
const { processExcelFile, generateExcelTemplate } = require('../utils/excelProcessor');

exports.importUsers = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No se ha enviado ningún archivo' });
        }
        
        const validMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        
        if (!validMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({ msg: 'El archivo debe ser de tipo Excel (.xlsx o .xls)' });
        }
        
        let residents;
        try {
            residents = processExcelFile(req.file.buffer);
        } catch (parseError) {
            return res.status(400).json({ msg: parseError.message });
        }
        
        if (!residents || residents.length === 0) {
            return res.status(400).json({ msg: 'No se encontraron residentes válidos en el archivo' });
        }
        
        const results = {
            success: [],
            errors: []
        };
        
        // Insertar residentes uno por uno
        for (const residentData of residents) {
            try {
                // Verificar si la cédula ya existe
                const existingResident = await Resident.findOne({ cedula: residentData.cedula });
                if (existingResident) {
                    results.errors.push({
                        cedula: residentData.cedula,
                        name: `${residentData.name} ${residentData.apellido}`,
                        msg: 'La cédula ya está registrada'
                    });
                    continue;
                }
                
                // Verificar email si existe
                if (residentData.email) {
                    const existingEmail = await Resident.findOne({ email: residentData.email });
                    if (existingEmail) {
                        results.errors.push({
                            cedula: residentData.cedula,
                            name: `${residentData.name} ${residentData.apellido}`,
                            msg: 'El email ya está registrado'
                        });
                        continue;
                    }
                }
                
                // Crear residente
                const newResident = new Resident(residentData);
                await newResident.save();
                
                results.success.push({
                    cedula: residentData.cedula,
                    name: `${residentData.name} ${residentData.apellido}`,
                    lote: residentData.lote || 'N/A'
                });
                
            } catch (err) {
                results.errors.push({
                    cedula: residentData.cedula || 'N/A',
                    name: `${residentData.name} ${residentData.apellido}`,
                    msg: err.message
                });
            }
        }
        
        res.json({
            msg: 'Proceso de importación completado',
            total: residents.length,
            imported: results.success.length,
            failed: results.errors.length,
            success: results.success,
            errors: results.errors
        });
        
    } catch (err) {
        console.error('Error en importación:', err);
        res.status(500).json({ msg: 'Error procesando archivo', error: err.message });
    }
};

exports.downloadTemplate = (req, res) => {
    try {
        const buffer = generateExcelTemplate();
        const fecha = new Date().toISOString().split('T')[0];
        const filename = `plantilla_residentes_${fecha}.xlsx`;
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (err) {
        console.error('Error generando plantilla:', err);
        res.status(500).json({ msg: 'Error generando plantilla', error: err.message });
    }
};