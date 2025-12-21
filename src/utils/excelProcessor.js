// src/utils/excelProcessor.js
const xlsx = require('xlsx');

exports.processExcelFile = (fileBuffer) => {
    try {
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = xlsx.utils.sheet_to_json(worksheet);
        
        if (!rawData || rawData.length === 0) {
            throw new Error('El archivo está vacío o no tiene datos válidos');
        }
        
        // 👇 SIN CAMPO PASSWORD
        const residents = rawData.map((row, index) => {
            const rowNumber = index + 2;
            
            // Validar campos obligatorios (SIN password)
            if (!row.name || !row.apellido || !row.cedula || !row.fechaNacimiento || !row.genero) {
                throw new Error(
                    `Fila ${rowNumber}: Faltan campos obligatorios. ` +
                    `Requeridos: name, apellido, cedula, fechaNacimiento, genero`
                );
            }
            
            // Validar género
            const validGeneros = ['Masculino', 'Femenino', 'Otro'];
            if (!validGeneros.includes(row.genero)) {
                throw new Error(
                    `Fila ${rowNumber}: Género inválido "${row.genero}". ` +
                    `Debe ser: Masculino, Femenino u Otro`
                );
            }
            
            // Validar email si existe
            if (row.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(row.email)) {
                    throw new Error(`Fila ${rowNumber}: Email inválido "${row.email}"`);
                }
            }
            
            // 👇 Construir objeto de residente (SIN password)
            return {
                name: row.name.toString().trim(),
                apellido: row.apellido.toString().trim(),
                cedula: row.cedula.toString().trim(),
                email: row.email ? row.email.toString().trim().toLowerCase() : undefined,
                fechaNacimiento: parseExcelDate(row.fechaNacimiento, rowNumber),
                genero: row.genero.toString().trim(),
                telefono: row.telefono ? row.telefono.toString().trim() : undefined,
                direccion: row.direccion ? row.direccion.toString().trim() : undefined,
                lote: row.lote ? row.lote.toString().trim() : undefined
            };
        });
        
        return residents;
    } catch (error) {
        throw new Error(`Error procesando Excel: ${error.message}`);
    }
};

function parseExcelDate(excelDate, rowNumber) {
    try {
        if (typeof excelDate === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + excelDate * 86400000);
            if (isNaN(date.getTime())) throw new Error('Fecha inválida');
            return date;
        }
        
        if (typeof excelDate === 'string') {
            let date;
            if (/^\d{4}-\d{2}-\d{2}$/.test(excelDate)) {
                date = new Date(excelDate);
            } else if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(excelDate)) {
                const parts = excelDate.split(/[/-]/);
                date = new Date(parts[2], parts[1] - 1, parts[0]);
            } else {
                date = new Date(excelDate);
            }
            if (isNaN(date.getTime())) throw new Error('Formato de fecha no reconocido');
            return date;
        }
        
        if (excelDate instanceof Date) {
            if (isNaN(excelDate.getTime())) throw new Error('Fecha inválida');
            return excelDate;
        }
        
        throw new Error('Formato de fecha no reconocido');
    } catch (error) {
        throw new Error(
            `Fila ${rowNumber}: Error en fecha "${excelDate}". ` +
            `Use formato: YYYY-MM-DD o DD/MM/YYYY`
        );
    }
}

// 👇 Plantilla actualizada SIN password
exports.generateExcelTemplate = () => {
    const template = [
        {
            name: 'Juan',
            apellido: 'Pérez',
            cedula: '1234567890',
            email: 'juan.perez@ejemplo.com',
            fechaNacimiento: '1990-05-15',
            genero: 'Masculino',
            telefono: '3001234567',
            direccion: 'Calle 123 #45-67',
            lote: 'A-15'
        },
        {
            name: 'María',
            apellido: 'García',
            cedula: '0987654321',
            email: 'maria.garcia@ejemplo.com',
            fechaNacimiento: '1985-08-20',
            genero: 'Femenino',
            telefono: '3109876543',
            direccion: 'Carrera 45 #67-89',
            lote: 'B-22'
        }
    ];
    
    const worksheet = xlsx.utils.json_to_sheet(template);
    
    const colWidths = [
        { wch: 15 }, // name
        { wch: 15 }, // apellido
        { wch: 15 }, // cedula
        { wch: 25 }, // email
        { wch: 15 }, // fechaNacimiento
        { wch: 12 }, // genero
        { wch: 15 }, // telefono
        { wch: 25 }, // direccion
        { wch: 10 }  // lote
    ];
    worksheet['!cols'] = colWidths;
    
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Residentes');
    
    const instrucciones = [
        { Instruccion: 'CAMPOS OBLIGATORIOS:', Detalle: 'name, apellido, cedula, fechaNacimiento, genero' },
        { Instruccion: 'CAMPOS OPCIONALES:', Detalle: 'email, telefono, direccion, lote' },
        { Instruccion: 'Formato de fecha:', Detalle: 'YYYY-MM-DD (ejemplo: 1990-05-15)' },
        { Instruccion: 'Géneros válidos:', Detalle: 'Masculino, Femenino, Otro' },
        { Instruccion: 'Cédula:', Detalle: 'Debe ser única' },
        { Instruccion: '', Detalle: '' },
        { Instruccion: 'NOTA:', Detalle: 'No elimine la primera fila (encabezados)' }
    ];
    
    const wsInstrucciones = xlsx.utils.json_to_sheet(instrucciones);
    wsInstrucciones['!cols'] = [{ wch: 25 }, { wch: 50 }];
    xlsx.utils.book_append_sheet(workbook, wsInstrucciones, 'Instrucciones');
    
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
};