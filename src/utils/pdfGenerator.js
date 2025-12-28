// src/utils/pdfGenerator.js - Generación de Actas e Informes en PDF
const PDFDocument = require('pdfkit');

/**
 * Generar ACTA de REUNIÓN (Versión mejorada con decisiones destacadas)
 */
exports.generateActa = async (event, attendances) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // =============== ENCABEZADO ===============
            doc.fontSize(22).font('Helvetica-Bold')
               .fillColor('#1e3a8a')
               .text('ACTA DE REUNIÓN', { align: 'center' });
            doc.fillColor('#000000');
            doc.moveDown(0.3);
            
            // Línea decorativa
            doc.moveTo(100, doc.y).lineTo(500, doc.y).stroke();
            doc.moveDown(1.5);

            // =============== INFORMACIÓN GENERAL ===============
            doc.fontSize(14).font('Helvetica-Bold')
               .fillColor('#374151')
               .text('INFORMACIÓN GENERAL');
            doc.fillColor('#000000');
            doc.moveDown(0.5);

            doc.fontSize(11).font('Helvetica');
            doc.text(`Título: `, { continued: true }).font('Helvetica-Bold').text(event.title);
            doc.font('Helvetica');
            doc.text(`Fecha: ${new Date(event.date).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}`);
            doc.text(`Hora: ${event.startTime} - ${event.endTime || 'N/A'}`);
            doc.text(`Lugar: ${event.location}`);
            doc.moveDown(0.5);

            // Organizador
            if (event.organizer) {
                doc.fontSize(11).font('Helvetica');
                doc.text('Organizado por: ', { continued: true })
                   .font('Helvetica-Bold')
                   .text(`${event.organizer.name} ${event.organizer.apellido || ''}`);
                doc.moveDown();
            }

            // Línea separadora
            doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y)
               .strokeColor('#e5e7eb').stroke().strokeColor('#000000');
            doc.moveDown();

            // =============== DESCRIPCIÓN ===============
            doc.fontSize(14).font('Helvetica-Bold')
               .fillColor('#374151')
               .text('DESCRIPCIÓN');
            doc.fillColor('#000000');
            doc.moveDown(0.5);

            doc.fontSize(11).font('Helvetica')
               .text(event.description, { align: 'justify' });
            doc.moveDown();

            // =============== ORDEN DEL DÍA (AGENDA) ===============
            if (event.agenda && event.agenda.length > 0) {
                doc.fontSize(14).font('Helvetica-Bold')
                   .fillColor('#374151')
                   .text('ORDEN DEL DÍA');
                doc.fillColor('#000000');
                doc.moveDown(0.5);

                doc.fontSize(11).font('Helvetica');
                event.agenda.forEach((item, index) => {
                    doc.font('Helvetica-Bold')
                       .text(`${index + 1}. ${item.punto}`);
                    if (item.descripcion) {
                        doc.font('Helvetica')
                           .fillColor('#4b5563')
                           .text(`   ${item.descripcion}`, { indent: 20 });
                        doc.fillColor('#000000');
                    }
                    doc.moveDown(0.3);
                });
                doc.moveDown();
            }

            // =============== DECISIONES TOMADAS ===============
            doc.fontSize(14).font('Helvetica-Bold')
               .fillColor('#7c3aed') // Color morado para destacar
               .text('DECISIONES TOMADAS', { underline: true });
            doc.fillColor('#000000');
            doc.moveDown(0.5);

            if (event.decisions && event.decisions.length > 0) {
                doc.fontSize(11).font('Helvetica');
                
                event.decisions.forEach((dec, index) => {
                    // Caja de fondo para cada decisión
                    const boxY = doc.y;
                    const boxHeight = 60; // Ajustar según necesidad
                    
                    // Fondo gris claro
                    doc.rect(50, boxY, doc.page.width - 100, boxHeight)
                       .fillAndStroke('#f3f4f6', '#d1d5db');
                    
                    // Restaurar posición para texto
                    doc.y = boxY + 10;
                    
                    // Número de decisión
                    doc.fontSize(12).font('Helvetica-Bold')
                       .fillColor('#7c3aed')
                       .text(`DECISIÓN ${index + 1}`, 60, doc.y);
                    doc.fillColor('#000000');
                    doc.moveDown(0.5);
                    
                    // Texto de la decisión
                    doc.fontSize(10).font('Helvetica')
                       .text(dec.decision, 60, doc.y, { 
                           width: doc.page.width - 120,
                           align: 'justify' 
                       });
                    
                    // Responsable
                    if (dec.responsable) {
                        doc.moveDown(0.3);
                        doc.fontSize(9).font('Helvetica-Oblique')
                           .fillColor('#059669')
                           .text(`✓ Responsable: ${dec.responsable}`, 60);
                        doc.fillColor('#000000');
                    }
                    
                    doc.y = boxY + boxHeight + 10;
                });
                doc.moveDown();
            } else {
                doc.fontSize(11).font('Helvetica-Oblique')
                   .fillColor('#9ca3af')
                   .text('No se registraron decisiones en esta reunión.');
                doc.fillColor('#000000');
                doc.moveDown();
            }

            // =============== PARTICIPACIÓN ===============
            doc.fontSize(14).font('Helvetica-Bold')
               .fillColor('#374151')
               .text('PARTICIPACIÓN');
            doc.fillColor('#000000');
            doc.moveDown(0.5);

            // Asistentes
            doc.fontSize(12).font('Helvetica-Bold')
               .fillColor('#059669')
               .text(`✓ Asistentes (${attendances.filter(a => a.status === 'asistio').length})`);
            doc.fillColor('#000000');
            doc.moveDown(0.3);

            const asistentes = attendances.filter(a => a.status === 'asistio');
            if (asistentes.length > 0) {
                doc.fontSize(10).font('Helvetica');
                asistentes.forEach((att, index) => {
                    const llegada = att.arrivalTime ? ` - Llegada: ${att.arrivalTime}` : '';
                    doc.text(`   ${index + 1}. ${att.user.name} ${att.user.apellido}${llegada}`);
                });
            } else {
                doc.fontSize(10).font('Helvetica-Oblique')
                   .fillColor('#9ca3af')
                   .text('   No hay asistentes registrados.');
                doc.fillColor('#000000');
            }
            doc.moveDown();

            // Ausentes
            const ausentes = attendances.filter(a => a.status === 'falto');
            if (ausentes.length > 0) {
                doc.fontSize(12).font('Helvetica-Bold')
                   .fillColor('#dc2626')
                   .text(`✗ Ausentes (${ausentes.length})`);
                doc.fillColor('#000000');
                doc.moveDown(0.3);

                doc.fontSize(10).font('Helvetica');
                ausentes.forEach((att, index) => {
                    doc.text(`   ${index + 1}. ${att.user.name} ${att.user.apellido}`);
                });
                doc.moveDown();
            }

            // Justificados
            const justificados = attendances.filter(a => a.status === 'justificado');
            if (justificados.length > 0) {
                doc.fontSize(12).font('Helvetica-Bold')
                   .fillColor('#f59e0b')
                   .text(`⚠ Ausencias Justificadas (${justificados.length})`);
                doc.fillColor('#000000');
                doc.moveDown(0.3);

                doc.fontSize(10).font('Helvetica');
                justificados.forEach((att, index) => {
                    doc.text(`   ${index + 1}. ${att.user.name} ${att.user.apellido}`);
                    if (att.justification) {
                        doc.font('Helvetica-Oblique')
                           .fillColor('#6b7280')
                           .text(`      Justificación: ${att.justification}`);
                        doc.fillColor('#000000').font('Helvetica');
                    }
                });
                doc.moveDown();
            }

            // =============== OBSERVACIONES ===============
            if (event.observations) {
                doc.fontSize(14).font('Helvetica-Bold')
                   .fillColor('#374151')
                   .text('OBSERVACIONES');
                doc.fillColor('#000000');
                doc.moveDown(0.5);

                doc.fontSize(11).font('Helvetica')
                   .text(event.observations, { align: 'justify' });
                doc.moveDown();
            }

            // =============== ARCHIVO MULTIMEDIA ===============
            if (event.media && event.media.url) {
                doc.fontSize(10).font('Helvetica-Oblique')
                   .fillColor('#6b7280')
                   .text(`📎 Archivo adjunto: ${event.media.type === 'image' ? 'Imagen' : 'Video'} disponible en el sistema`, { 
                       align: 'center'
                   });
                doc.fillColor('#000000');
                doc.moveDown(2);
            }

            // =============== FIRMA ===============
            doc.moveDown(3);
            doc.fontSize(11).font('Helvetica');
            doc.text('_________________________________', { align: 'center' });
            doc.text('Firma del Organizador', { align: 'center' });
            if (event.organizer) {
                doc.font('Helvetica-Bold')
                   .text(`${event.organizer.name} ${event.organizer.apellido || ''}`, { align: 'center' });
            }

            // =============== FOOTER ===============
            doc.fontSize(8).font('Helvetica-Oblique')
               .fillColor('#9ca3af')
               .text(
                   `Documento generado automáticamente el ${new Date().toLocaleString('es-ES')}`,
                   50,
                   doc.page.height - 50,
                   { align: 'center', width: doc.page.width - 100 }
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

/**
 * Generar HISTORIAL PÚBLICO de asistencia por cédula
 */
exports.generateHistorialPDF = async (user, attendances, stats) => {
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
            doc.fontSize(22).font('Helvetica-Bold').text('HISTORIAL DE ASISTENCIA', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica').fillColor('#666666')
                .text('Registro de Participación en Eventos Comunitarios', { align: 'center' });
            doc.fillColor('#000000');
            doc.moveDown(2);

            // Información del residente
            doc.fontSize(14).font('Helvetica-Bold').text('Información del Residente');
            doc.moveDown(0.5);
            
            // Crear una tabla de información
            const startY = doc.y;
            doc.fontSize(10).font('Helvetica-Bold').text('Nombre:', 50, startY);
            doc.font('Helvetica').text(`${user.name} ${user.apellido || ''}`, 150, startY);
            
            doc.font('Helvetica-Bold').text('Cédula:', 50, startY + 15);
            doc.font('Helvetica').text(user.cedula, 150, startY + 15);
            
            if (user.lote) {
                doc.font('Helvetica-Bold').text('Lote:', 50, startY + 30);
                doc.font('Helvetica').text(user.lote, 150, startY + 30);
            }
            
            if (user.email) {
                doc.font('Helvetica-Bold').text('Email:', 50, startY + 45);
                doc.font('Helvetica').text(user.email, 150, startY + 45);
            }
            
            doc.moveDown(4);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();

            // Resumen Estadístico
            doc.fontSize(14).font('Helvetica-Bold').text('Resumen Estadístico');
            doc.moveDown(0.5);
            
            const statsY = doc.y;
            const col1X = 50;
            const col2X = 200;
            const col3X = 380;
            
            // Primera fila
            doc.fontSize(10).font('Helvetica-Bold').text('Total de Eventos:', col1X, statsY);
            doc.font('Helvetica').text(stats.totalEventos.toString(), col1X + 100, statsY);
            
            doc.font('Helvetica-Bold').text('Reuniones:', col2X, statsY);
            doc.font('Helvetica').text(stats.reuniones.toString(), col2X + 70, statsY);
            
            doc.font('Helvetica-Bold').text('Trabajos:', col3X, statsY);
            doc.font('Helvetica').text(stats.trabajos.toString(), col3X + 70, statsY);
            
            // Segunda fila
            doc.font('Helvetica-Bold').text('Asistencias:', col1X, statsY + 20);
            doc.font('Helvetica').fillColor('#28a745').text(stats.asistencias.toString(), col1X + 100, statsY + 20);
            doc.fillColor('#000000');
            
            doc.font('Helvetica-Bold').text('Faltas:', col2X, statsY + 20);
            doc.font('Helvetica').fillColor('#dc3545').text(stats.faltas.toString(), col2X + 70, statsY + 20);
            doc.fillColor('#000000');
            
            doc.font('Helvetica-Bold').text('Justificadas:', col3X, statsY + 20);
            doc.font('Helvetica').fillColor('#ffc107').text(stats.justificadas.toString(), col3X + 70, statsY + 20);
            doc.fillColor('#000000');
            
            // Porcentaje de asistencia
            doc.moveDown(3);
            doc.fontSize(12).font('Helvetica-Bold').text('Porcentaje de Asistencia: ');
            const percentage = parseFloat(stats.porcentajeAsistencia);
            let color = '#28a745'; // Verde por defecto
            if (percentage < 50) color = '#dc3545'; // Rojo
            else if (percentage < 75) color = '#ffc107'; // Amarillo
            
            doc.fillColor(color).fontSize(14).text(`${stats.porcentajeAsistencia}%`, { continued: false });
            doc.fillColor('#000000');
            
            doc.moveDown();
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();

            // Detalle de Asistencias
            doc.fontSize(14).font('Helvetica-Bold').text('Historial Detallado de Eventos');
            doc.moveDown(0.5);

            if (attendances.length === 0) {
                doc.fontSize(10).font('Helvetica-Oblique')
                    .text('No hay registros de asistencia.', { align: 'center' });
            } else {
                attendances.forEach((att, index) => {
                    // Verificar si necesitamos una nueva página
                    if (doc.y > 700) {
                        doc.addPage();
                    }
                    
                    if (!att.event) return; // Skip si el evento fue eliminado
                    
                    const eventY = doc.y;
                    
                    // Número y título del evento
                    doc.fontSize(11).font('Helvetica-Bold')
                        .text(`${index + 1}. ${att.event.title}`, 50, eventY);
                    doc.moveDown(0.3);
                    
                    // Tipo y fecha
                    const typeLabel = att.event.type === 'reunion' ? 'Reunión' : 'Trabajo Comunitario';
                    doc.fontSize(9).font('Helvetica')
                        .text(`Tipo: ${typeLabel} | Fecha: ${new Date(att.event.date).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}`);
                    
                    // Horario
                    if (att.event.startTime) {
                        doc.text(`Horario: ${att.event.startTime}${att.event.endTime ? ' - ' + att.event.endTime : ''}`);
                    }
                    
                    // Lugar
                    if (att.event.location) {
                        doc.text(`Lugar: ${att.event.location}`);
                    }
                    
                    // Estado de asistencia con color
                    doc.font('Helvetica-Bold').text('Estado: ', { continued: true });
                    
                    let statusText = '';
                    let statusColor = '#000000';
                    
                    switch (att.status) {
                        case 'asistio':
                            statusText = 'ASISTIÓ';
                            statusColor = '#28a745';
                            break;
                        case 'falto':
                            statusText = 'FALTÓ';
                            statusColor = '#dc3545';
                            break;
                        case 'justificado':
                            statusText = 'JUSTIFICADO';
                            statusColor = '#ffc107';
                            break;
                        default:
                            statusText = att.status.toUpperCase();
                    }
                    
                    doc.fillColor(statusColor).font('Helvetica-Bold').text(statusText);
                    doc.fillColor('#000000').font('Helvetica');
                    
                    // Horarios de llegada/salida
                    if (att.arrivalTime) {
                        doc.text(`Hora de llegada: ${att.arrivalTime}`);
                    }
                    if (att.departureTime) {
                        doc.text(`Hora de salida: ${att.departureTime}`);
                    }
                    
                    // Justificación si existe
                    if (att.justification) {
                        doc.fontSize(9).font('Helvetica-Oblique')
                            .text(`Justificación: ${att.justification}`, { indent: 10 });
                        doc.font('Helvetica');
                    }
                    
                    // Notas si existen
                    if (att.notes) {
                        doc.fontSize(9).font('Helvetica-Oblique')
                            .text(`Notas: ${att.notes}`, { indent: 10 });
                        doc.font('Helvetica');
                    }
                    
                    // Organizador
                    if (att.event.organizer) {
                        doc.fontSize(9).text(`Organizado por: ${att.event.organizer.name} ${att.event.organizer.apellido || ''}`);
                    }
                    
                    doc.moveDown(0.5);
                    
                    // Línea separadora
                    if (index < attendances.length - 1) {
                        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#cccccc');
                        doc.moveDown(0.5);
                    }
                });
            }

            // Footer en todas las páginas
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                
                doc.fontSize(8).fillColor('#666666')
                    .text(
                        `Página ${i + 1} de ${range.count} | Generado el ${new Date().toLocaleString('es-ES')}`,
                        50,
                        doc.page.height - 50,
                        { align: 'center', width: doc.page.width - 100 }
                    );
                
                doc.fillColor('#000000');
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};