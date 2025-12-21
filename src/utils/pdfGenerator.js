// src/utils/pdfGenerator.js - Generación de Actas e Informes en PDF
const PDFDocument = require('pdfkit');

/**
 * Generar ACTA de REUNIÓN
 */
exports.generateActa = async (event, attendances) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Encabezado
            doc.fontSize(20).font('Helvetica-Bold').text('ACTA DE REUNIÓN', { align: 'center' });
            doc.moveDown();

            // Información del evento
            doc.fontSize(12).font('Helvetica-Bold').text('Información General');
            doc.fontSize(10).font('Helvetica');
            doc.text(`Título: ${event.title}`);
            doc.text(`Fecha: ${new Date(event.date).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}`);
            doc.text(`Hora: ${event.startTime} - ${event.endTime || 'N/A'}`);
            doc.text(`Lugar: ${event.location}`);
            doc.moveDown();

            // Organizador
            if (event.organizer) {
                doc.fontSize(12).font('Helvetica-Bold').text('Organizado por:');
                doc.fontSize(10).font('Helvetica');
                doc.text(`${event.organizer.name} ${event.organizer.apellido || ''}`);
                doc.moveDown();
            }

            // Descripción
            doc.fontSize(12).font('Helvetica-Bold').text('Descripción:');
            doc.fontSize(10).font('Helvetica');
            doc.text(event.description, { align: 'justify' });
            doc.moveDown();

            // Asistentes
            doc.fontSize(12).font('Helvetica-Bold').text('Asistentes:');
            doc.fontSize(10).font('Helvetica');
            
            const asistentes = attendances.filter(a => a.status === 'asistio');
            if (asistentes.length > 0) {
                asistentes.forEach((att, index) => {
                    const llegada = att.arrivalTime ? ` - Llegada: ${att.arrivalTime}` : '';
                    doc.text(`${index + 1}. ${att.user.name} ${att.user.apellido}${llegada}`);
                });
            } else {
                doc.text('No hay asistentes registrados.');
            }
            doc.moveDown();

            // Ausentes
            const ausentes = attendances.filter(a => a.status === 'falto');
            if (ausentes.length > 0) {
                doc.fontSize(12).font('Helvetica-Bold').text('Ausentes:');
                doc.fontSize(10).font('Helvetica');
                ausentes.forEach((att, index) => {
                    doc.text(`${index + 1}. ${att.user.name} ${att.user.apellido}`);
                });
                doc.moveDown();
            }

            // Justificados
            const justificados = attendances.filter(a => a.status === 'justificado');
            if (justificados.length > 0) {
                doc.fontSize(12).font('Helvetica-Bold').text('Ausencias Justificadas:');
                doc.fontSize(10).font('Helvetica');
                justificados.forEach((att, index) => {
                    doc.text(`${index + 1}. ${att.user.name} ${att.user.apellido}`);
                    if (att.justification) {
                        doc.text(`   Justificación: ${att.justification}`, { indent: 20 });
                    }
                });
                doc.moveDown();
            }

            // Agenda
            if (event.agenda && event.agenda.length > 0) {
                doc.fontSize(12).font('Helvetica-Bold').text('Orden del Día:');
                doc.fontSize(10).font('Helvetica');
                event.agenda.forEach((item, index) => {
                    doc.text(`${index + 1}. ${item.punto}`);
                    if (item.descripcion) {
                        doc.text(`   ${item.descripcion}`, { indent: 20 });
                    }
                });
                doc.moveDown();
            }

            // Decisiones
            if (event.decisions && event.decisions.length > 0) {
                doc.fontSize(12).font('Helvetica-Bold').text('Decisiones Tomadas:');
                doc.fontSize(10).font('Helvetica');
                event.decisions.forEach((dec, index) => {
                    doc.text(`${index + 1}. ${dec.decision}`);
                    if (dec.responsable) {
                        doc.text(`   Responsable: ${dec.responsable}`, { indent: 20 });
                    }
                });
                doc.moveDown();
            }

            // Observaciones
            if (event.observations) {
                doc.fontSize(12).font('Helvetica-Bold').text('Observaciones:');
                doc.fontSize(10).font('Helvetica');
                doc.text(event.observations, { align: 'justify' });
                doc.moveDown();
            }

            // Si hay imagen/video, mencionar
            if (event.media && event.media.url) {
                doc.fontSize(10).font('Helvetica-Oblique');
                doc.text(`Archivo adjunto: ${event.media.type === 'image' ? 'Imagen' : 'Video'} disponible en el sistema`, { 
                    align: 'center',
                    color: '#666666'
                });
                doc.moveDown();
            }

            // Firma
            doc.moveDown(2);
            doc.fontSize(10).font('Helvetica');
            doc.text('_________________________________', { align: 'center' });
            doc.text('Firma del Organizador', { align: 'center' });
            if (event.organizer) {
                doc.text(`${event.organizer.name} ${event.organizer.apellido || ''}`, { align: 'center' });
            }

            // Footer
            doc.fontSize(8).text(
                `Generado el ${new Date().toLocaleString('es-ES')}`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generar INFORME de TRABAJO COMUNITARIO
 */
exports.generateInforme = async (event, attendances) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Encabezado
            doc.fontSize(20).font('Helvetica-Bold').text('INFORME DE TRABAJO COMUNITARIO', { align: 'center' });
            doc.moveDown();

            // Información del evento
            doc.fontSize(12).font('Helvetica-Bold').text('Información General');
            doc.fontSize(10).font('Helvetica');
            doc.text(`Título: ${event.title}`);
            doc.text(`Fecha: ${new Date(event.date).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}`);
            doc.text(`Hora: ${event.startTime} - ${event.endTime || 'N/A'}`);
            doc.text(`Lugar: ${event.location}`);
            doc.moveDown();

            // Organizador
            if (event.organizer) {
                doc.fontSize(12).font('Helvetica-Bold').text('Organizado por:');
                doc.fontSize(10).font('Helvetica');
                doc.text(`${event.organizer.name} ${event.organizer.apellido || ''}`);
                doc.moveDown();
            }

            // Descripción
            doc.fontSize(12).font('Helvetica-Bold').text('Descripción del Trabajo:');
            doc.fontSize(10).font('Helvetica');
            doc.text(event.description, { align: 'justify' });
            doc.moveDown();

            // Participantes
            doc.fontSize(12).font('Helvetica-Bold').text('Participantes:');
            doc.fontSize(10).font('Helvetica');
            
            const participantes = attendances.filter(a => a.status === 'asistio');
            if (participantes.length > 0) {
                participantes.forEach((att, index) => {
                    const horario = att.arrivalTime && att.departureTime 
                        ? ` (${att.arrivalTime} - ${att.departureTime})`
                        : att.arrivalTime 
                        ? ` (Entrada: ${att.arrivalTime})`
                        : '';
                    doc.text(`${index + 1}. ${att.user.name} ${att.user.apellido}${horario}`);
                    if (att.notes) {
                        doc.text(`   Nota: ${att.notes}`, { indent: 20, fontSize: 9 });
                    }
                });
                doc.moveDown();
                doc.fontSize(11).font('Helvetica-Bold').text(`Total de participantes: ${participantes.length}`);
                doc.font('Helvetica');
            } else {
                doc.text('No hay participantes registrados.');
            }
            doc.moveDown();

            // Información de imagen/video si existe
            if (event.media && event.media.url) {
                doc.fontSize(12).font('Helvetica-Bold').text('Registro Multimedia:');
                doc.fontSize(10).font('Helvetica');
                
                const tipoMedia = event.media.type === 'image' ? 'Fotografía' : 'Video';
                doc.text(`• Tipo: ${tipoMedia}`);
                
                if (event.media.metadata) {
                    if (event.media.metadata.width && event.media.metadata.height) {
                        doc.text(`• Resolución: ${event.media.metadata.width} x ${event.media.metadata.height}`);
                    }
                    if (event.media.metadata.duration) {
                        const minutes = Math.floor(event.media.metadata.duration / 60);
                        const seconds = Math.floor(event.media.metadata.duration % 60);
                        doc.text(`• Duración: ${minutes}:${seconds.toString().padStart(2, '0')}`);
                    }
                }
                
                doc.fontSize(9).font('Helvetica-Oblique');
                doc.text('El archivo multimedia está disponible en el sistema digital', { color: '#666666' });
                doc.font('Helvetica');
                doc.moveDown();
            }

            // Observaciones
            if (event.observations) {
                doc.fontSize(12).font('Helvetica-Bold').text('Observaciones:');
                doc.fontSize(10).font('Helvetica');
                doc.text(event.observations, { align: 'justify' });
                doc.moveDown();
            }

            // Firma
            doc.moveDown(2);
            doc.fontSize(10).font('Helvetica');
            doc.text('_________________________________', { align: 'center' });
            doc.text('Firma del Organizador', { align: 'center' });
            if (event.organizer) {
                doc.text(`${event.organizer.name} ${event.organizer.apellido || ''}`, { align: 'center' });
            }

            // Footer
            doc.fontSize(8).text(
                `Generado el ${new Date().toLocaleString('es-ES')}`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};