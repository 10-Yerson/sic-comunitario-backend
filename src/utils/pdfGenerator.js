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