// src/utils/pdfGenerator.js - Generación de Actas e Informes en PDF
const PDFDocument = require('pdfkit');

/**
 * Generar ACTA de REUNIÓN (Versión mejorada con decisiones destacadas)
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

            // =============== ENCABEZADO ===============
            doc.fontSize(20).font('Helvetica-Bold')
                .fillColor('#1e3a8a') // Azul
                .text('ACTA DE REUNIÓN', { align: 'center' });
            doc.fillColor('#000000');
            doc.moveDown(0.5);

            // Línea decorativa
            doc.moveTo(150, doc.y).lineTo(450, doc.y)
                .strokeColor('#1e3a8a').stroke().strokeColor('#000000');
            doc.moveDown();

            // =============== INFORMACIÓN GENERAL ===============
            doc.fontSize(12).font('Helvetica-Bold').text('Información General');
            doc.moveDown(0.3);

            doc.fontSize(10).font('Helvetica');
            doc.text(`Título: `, { continued: true })
                .font('Helvetica-Bold').text(event.title);
            doc.font('Helvetica');
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

            // =============== DESCRIPCIÓN ===============
            doc.fontSize(12).font('Helvetica-Bold').text('Descripción:');
            doc.moveDown(0.3);
            doc.fontSize(10).font('Helvetica');
            doc.text(event.description, { align: 'justify' });
            doc.moveDown();

            // =============== PARTICIPACIÓN ===============
            doc.fontSize(12).font('Helvetica-Bold')
                .text('Participación:');
            doc.moveDown(0.5);

            const asistentes = attendances.filter(a => a.status === 'asistio');
            const ausentes = attendances.filter(a => a.status === 'falto');
            const justificados = attendances.filter(a => a.status === 'justificado');

            // Resumen en una línea
            doc.fontSize(10).font('Helvetica');
            doc.fillColor('#059669').text(`✓ Asistentes  : ${asistentes.length}`, { continued: true });
            doc.fillColor('#000000').text('  |  ', { continued: true });
            doc.fillColor('#dc2626').text(`✗ Ausentes  : ${ausentes.length}`, { continued: true });
            doc.fillColor('#000000').text('  |  ', { continued: true });
            doc.fillColor('#f59e0b').text(`⚠ Justificados  : ${justificados.length}`);
            doc.fillColor('#000000');
            doc.moveDown();

            // =============== ASISTENTES ===============
            if (asistentes.length > 0) {
                doc.fontSize(11).font('Helvetica-Bold')
                    .fillColor('#059669')
                    .text('Asistentes:');
                doc.fillColor('#000000');
                doc.moveDown(0.3);

                doc.fontSize(10).font('Helvetica');
                asistentes.forEach((att, index) => {
                    // Fondo alternado para mejor lectura
                    if (index % 2 === 0) {
                        const boxY = doc.y - 2;
                        doc.rect(50, boxY, doc.page.width - 100, 16)
                            .fill('#f0fdf4');
                        doc.y = boxY + 2;
                    }

                    const llegada = att.arrivalTime ? ` - Llegada: ${att.arrivalTime}` : '';

                    // Número en verde
                    doc.fillColor('#059669').font('Helvetica-Bold')
                        .text(`${index + 1}. `, 60, doc.y, { continued: true });

                    // Nombre en negro
                    doc.fillColor('#000000').font('Helvetica')
                        .text(`${att.user.name} ${att.user.apellido}${llegada}`);
                });
                doc.moveDown();
            }

            // =============== AUSENTES ===============
            if (ausentes.length > 0) {
                doc.fontSize(11).font('Helvetica-Bold')
                    .fillColor('#dc2626')
                    .text('Ausentes:');
                doc.fillColor('#000000');
                doc.moveDown(0.3);

                doc.fontSize(10).font('Helvetica');
                ausentes.forEach((att, index) => {
                    // Fondo alternado
                    if (index % 2 === 0) {
                        const boxY = doc.y - 2;
                        doc.rect(50, boxY, doc.page.width - 100, 16)
                            .fill('#fef2f2');
                        doc.y = boxY + 2;
                    }

                    // Número en rojo
                    doc.fillColor('#dc2626').font('Helvetica-Bold')
                        .text(`${index + 1}. `, 60, doc.y, { continued: true });

                    // Nombre en negro
                    doc.fillColor('#000000').font('Helvetica')
                        .text(`${att.user.name} ${att.user.apellido}`);
                });
                doc.moveDown();
            }

            // =============== JUSTIFICADOS ===============
            if (justificados.length > 0) {
                doc.fontSize(11).font('Helvetica-Bold')
                    .fillColor('#f59e0b')
                    .text('Ausencias Justificadas:');
                doc.fillColor('#000000');
                doc.moveDown(0.3);

                doc.fontSize(10).font('Helvetica');
                justificados.forEach((att, index) => {
                    const boxY = doc.y - 2;
                    const hasJustification = att.justification && att.justification.trim() !== '';
                    const boxHeight = hasJustification ? 30 : 16;

                    // Fondo alternado
                    if (index % 2 === 0) {
                        doc.rect(50, boxY, doc.page.width - 100, boxHeight)
                            .fill('#fffbeb');
                        doc.y = boxY + 2;
                    }

                    // Número en naranja
                    doc.fillColor('#f59e0b').font('Helvetica-Bold')
                        .text(`${index + 1}. `, 60, doc.y, { continued: true });

                    // Nombre en negro
                    doc.fillColor('#000000').font('Helvetica')
                        .text(`${att.user.name} ${att.user.apellido}`);

                    if (hasJustification) {
                        doc.fillColor('#666666').fontSize(9).font('Helvetica-Oblique')
                            .text(`   Justificación: ${att.justification}`, 65, doc.y);
                        doc.fillColor('#000000').fontSize(10).font('Helvetica');
                    }

                    doc.y = boxY + boxHeight + 2;
                });
                doc.moveDown();
            }

            // =============== ORDEN DEL DÍA (AGENDA) ===============
            if (event.agenda && event.agenda.length > 0) {
                doc.fontSize(12).font('Helvetica-Bold').text('Orden del Día:');
                doc.moveDown(0.3);
                doc.fontSize(10).font('Helvetica');

                event.agenda.forEach((item, index) => {
                    // Número en azul
                    doc.fillColor('#1e3a8a').font('Helvetica-Bold')
                        .text(`${index + 1}. `, { continued: true });

                    // Punto en negro
                    doc.fillColor('#000000').font('Helvetica-Bold')
                        .text(item.punto);

                    if (item.descripcion) {
                        doc.fillColor('#666666').font('Helvetica')
                            .text(`   ${item.descripcion}`, { indent: 20 });
                        doc.fillColor('#000000');
                    }
                });
                doc.moveDown();
            }

            // =============== DECISIONES TOMADAS ===============
            doc.fontSize(12).font('Helvetica-Bold')
                .fillColor('#7c3aed')
                .text('Decisiones Tomadas:');
            doc.fillColor('#000000');
            doc.moveDown(0.3);

            if (event.decisions && event.decisions.length > 0) {
                doc.fontSize(10).font('Helvetica');

                event.decisions.forEach((dec, index) => {
                    // Número en morado
                    doc.fillColor('#7c3aed').font('Helvetica-Bold')
                        .text(`${index + 1}. `, { continued: true });

                    // Decisión en negro
                    doc.fillColor('#000000').font('Helvetica')
                        .text(dec.decision);

                    // Responsable en verde
                    if (dec.responsable) {
                        doc.fillColor('#059669').fontSize(9).font('Helvetica-Oblique')
                            .text(`   Responsable: ${dec.responsable}`, { indent: 20 });
                        doc.fillColor('#000000').fontSize(10).font('Helvetica');
                    }
                });
                doc.moveDown();
            } else {
                doc.fillColor('#999999').font('Helvetica-Oblique')
                    .text('No se registraron decisiones en esta reunión.');
                doc.fillColor('#000000').font('Helvetica');
                doc.moveDown();
            }

            // =============== OBSERVACIONES ===============
            if (event.observations) {
                doc.fontSize(12).font('Helvetica-Bold').text('Observaciones:');
                doc.moveDown(0.3);
                doc.fontSize(10).font('Helvetica');
                doc.text(event.observations, { align: 'justify' });
                doc.moveDown();
            }

            // =============== ARCHIVO MULTIMEDIA ===============
            if (event.media && event.media.url) {
                doc.fontSize(10).font('Helvetica-Oblique')
                    .fillColor('#666666')
                    .text(`Archivo adjunto: ${event.media.type === 'image' ? 'Imagen' : 'Video'} disponible en el sistema`, {
                        align: 'center'
                    });
                doc.fillColor('#000000');
                doc.moveDown(2);
            }

            // =============== FIRMA ===============
            doc.moveDown(2);
            doc.fontSize(10).font('Helvetica');
            doc.text('_________________________________', { align: 'center' });
            doc.text('Firma del Organizador', { align: 'center' });
            if (event.organizer) {
                doc.font('Helvetica-Bold')
                    .text(`${event.organizer.name} ${event.organizer.apellido || ''}`, { align: 'center' });
            }

            // =============== FOOTER ===============
            doc.fontSize(8).fillColor('#999999')
                .text(
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

            // =============== ENCABEZADO ===============
            doc.fontSize(20).font('Helvetica-Bold')
                .fillColor('#059669') // Verde
                .text('INFORME DE TRABAJO COMUNITARIO', { align: 'center' });
            doc.fillColor('#000000');
            doc.moveDown(0.5);

            // Línea decorativa
            doc.moveTo(150, doc.y).lineTo(450, doc.y)
                .strokeColor('#059669').stroke().strokeColor('#000000');
            doc.moveDown();

            // =============== INFORMACIÓN GENERAL ===============
            doc.fontSize(12).font('Helvetica-Bold').text('Información General');
            doc.moveDown(0.3);

            doc.fontSize(10).font('Helvetica');
            doc.text(`Título: `, { continued: true })
                .font('Helvetica-Bold').text(event.title);
            doc.font('Helvetica');
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

            // =============== DESCRIPCIÓN ===============
            doc.fontSize(12).font('Helvetica-Bold').text('Descripción del Trabajo:');
            doc.moveDown(0.3);
            doc.fontSize(10).font('Helvetica');
            doc.text(event.description, { align: 'justify' });
            doc.moveDown();

            // =============== PARTICIPANTES ===============
            doc.fontSize(12).font('Helvetica-Bold')
                .fillColor('#059669')
                .text('Participantes:');
            doc.fillColor('#000000');
            doc.moveDown(0.3);

            doc.fontSize(10).font('Helvetica');

            const participantes = attendances.filter(a => a.status === 'asistio');
            if (participantes.length > 0) {
                participantes.forEach((att, index) => {
                    const horario = att.arrivalTime && att.departureTime
                        ? ` (${att.arrivalTime} - ${att.departureTime})`
                        : att.arrivalTime
                            ? ` (Entrada: ${att.arrivalTime})`
                            : '';

                    // Número en verde
                    doc.fillColor('#059669').font('Helvetica-Bold')
                        .text(`${index + 1}. `, { continued: true });

                    // Nombre y horario en negro
                    doc.fillColor('#000000').font('Helvetica')
                        .text(`${att.user.name} ${att.user.apellido}${horario}`);

                    // Notas en gris claro
                    if (att.notes) {
                        doc.fillColor('#666666').fontSize(9).font('Helvetica-Oblique')
                            .text(`   Nota: ${att.notes}`, { indent: 20 });
                        doc.fillColor('#000000').fontSize(10).font('Helvetica');
                    }
                });
                doc.moveDown(0.5);

                // Total destacado
                doc.fontSize(11).font('Helvetica-Bold')
                    .fillColor('#059669')
                    .text(`Total de participantes: ${participantes.length}`);
                doc.fillColor('#000000').font('Helvetica');
            } else {
                doc.fillColor('#999999').font('Helvetica-Oblique')
                    .text('No hay participantes registrados.');
                doc.fillColor('#000000').font('Helvetica');
            }
            doc.moveDown();

            // =============== REGISTRO MULTIMEDIA ===============
            if (event.media && event.media.url) {
                doc.fontSize(12).font('Helvetica-Bold').text('Registro Multimedia:');
                doc.moveDown(0.3);
                doc.fontSize(10).font('Helvetica');

                const tipoMedia = event.media.type === 'image' ? 'Fotografía' : 'Video';
                doc.fillColor('#0369a1').text(`• Tipo: ${tipoMedia}`);

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
                doc.fillColor('#000000');

                doc.moveDown(0.3);
                doc.fontSize(9).font('Helvetica-Oblique')
                    .fillColor('#666666')
                    .text('El archivo multimedia está disponible en el sistema digital');
                doc.fillColor('#000000').font('Helvetica');
                doc.moveDown();
            }

            // =============== OBSERVACIONES ===============
            if (event.observations) {
                doc.fontSize(12).font('Helvetica-Bold').text('Observaciones:');
                doc.moveDown(0.3);
                doc.fontSize(10).font('Helvetica');
                doc.text(event.observations, { align: 'justify' });
                doc.moveDown();
            }

            // =============== FIRMA ===============
            doc.moveDown(2);
            doc.fontSize(10).font('Helvetica');
            doc.text('_________________________________', { align: 'center' });
            doc.text('Firma del Organizador', { align: 'center' });
            if (event.organizer) {
                doc.font('Helvetica-Bold')
                    .text(`${event.organizer.name} ${event.organizer.apellido || ''}`, { align: 'center' });
            }

            // =============== FOOTER ===============
            doc.fontSize(8).fillColor('#999999')
                .text(
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

            // ================= HEADER =================
            doc.fontSize(22)
                .font('Helvetica-Bold')
                .fillColor('#111827')
                .text('HISTORIAL DE ASISTENCIA', { align: 'center' });

            doc.moveDown(0.5);

            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#6b7280')
                .text('Registro de Participación en Eventos Comunitarios', { align: 'center' });

            doc.fillColor('#000000');
            doc.moveDown(2);


            // =============== INFORMACIÓN DEL RESIDENTE ===============
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#111827')
                .text('Información del Residente');

            doc.moveDown(0.5);

            const startY = doc.y;
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151')
                .text('Nombre:', 50, startY);
            doc.font('Helvetica').fillColor('#111827')
                .text(`${user.name} ${user.apellido || ''}`, 150, startY);

            doc.font('Helvetica-Bold').fillColor('#374151')
                .text('Cédula:', 50, startY + 15);
            doc.font('Helvetica').fillColor('#111827')
                .text(user.cedula, 150, startY + 15);

            if (user.lote) {
                doc.font('Helvetica-Bold').text('Lote:', 50, startY + 30);
                doc.font('Helvetica').text(user.lote, 150, startY + 30);
            }

            if (user.email) {
                doc.font('Helvetica-Bold').text('Email:', 50, startY + 45);
                doc.font('Helvetica').text(user.email, 150, startY + 45);
            }

            doc.moveDown(3);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#e5e7eb');
            doc.moveDown(1);


            // ================= RESUMEN ESTADÍSTICO =================
            doc.fontSize(14)
                .font('Helvetica-Bold')
                .fillColor('#111827')
                .text('Resumen Estadístico');

            doc.moveDown(1);

            const cardY = doc.y;
            const cardHeight = 90;

            // Fondo suave
            doc.rect(45, cardY - 5, 520, cardHeight + 10)
                .fillOpacity(0.03)
                .fillAndStroke('#000000');

            doc.fillOpacity(1);

            // Borde
            doc.roundedRect(50, cardY, 510, cardHeight, 8)
                .stroke('#d1d5db');

            const col1 = 70;
            const col2 = 245;
            const col3 = 420;

            // Títulos
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280');
            doc.text('Eventos Totales', col1, cardY + 10);
            doc.text('Reuniones', col2, cardY + 10);
            doc.text('Trabajos', col3, cardY + 10);

            // Números principales
            doc.fontSize(20).font('Helvetica-Bold').fillColor('#111827');
            doc.text(stats.totalEventos.toString(), col1, cardY + 28);
            doc.text(stats.reuniones.toString(), col2, cardY + 28);
            doc.text(stats.trabajos.toString(), col3, cardY + 28);

            // Subtítulos
            doc.fontSize(9).font('Helvetica-Bold');
            doc.fillColor('#059669').text('Asistencias', col1, cardY + 60);
            doc.fillColor('#dc2626').text('Faltas', col2, cardY + 60);
            doc.fillColor('#d97706').text('Justificadas', col3, cardY + 60);

            // Sub valores
            doc.fontSize(14).font('Helvetica-Bold');
            doc.fillColor('#059669').text(stats.asistencias.toString(), col1, cardY + 72);
            doc.fillColor('#dc2626').text(stats.faltas.toString(), col2, cardY + 72);
            doc.fillColor('#d97706').text(stats.justificadas.toString(), col3, cardY + 72);

            doc.fillColor('#000000');
            doc.moveDown(6);


            // ================= PORCENTAJE =================
            doc.fontSize(13)
                .font('Helvetica-Bold')
                .fillColor('#111827')
                .text('Porcentaje de Asistencia');

            doc.moveDown(0.3);

            const percentage = parseFloat(stats.porcentajeAsistencia);
            let color = '#059669';
            if (percentage < 50) color = '#dc2626';
            else if (percentage < 75) color = '#d97706';

            const barX = 50;
            const barY = doc.y;
            const barWidth = 500;
            const fillWidth = (barWidth * percentage) / 100;

            doc.roundedRect(barX, barY, barWidth, 14, 6).fill('#e5e7eb');
            doc.roundedRect(barX, barY, fillWidth, 14, 6).fill(color);

            doc.fillColor('#111827')
                .fontSize(12)
                .font('Helvetica-Bold')
                .text(`${stats.porcentajeAsistencia}%`, barX, barY + 20);

            doc.fillColor('#000000');
            doc.moveDown(2);

            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#e5e7eb');
            doc.moveDown(1);


            // ================= HISTORIAL =================
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#111827')
                .text('Historial Detallado de Eventos');

            doc.moveDown(0.5);

            if (attendances.length === 0) {
                doc.fontSize(10).font('Helvetica-Oblique')
                    .text('No hay registros de asistencia.', { align: 'center' });
            } else {
                attendances.forEach((att, index) => {
                    if (doc.y > 700) doc.addPage();
                    if (!att.event) return;

                    doc.fontSize(11).font('Helvetica-Bold')
                        .fillColor('#111827')
                        .text(`${index + 1}. ${att.event.title}`, 50, doc.y);

                    doc.moveDown(0.3);

                    const typeLabel = att.event.type === 'reunion' ? 'Reunión' : 'Trabajo Comunitario';

                    doc.fontSize(9).font('Helvetica').fillColor('#374151')
                        .text(`Tipo: ${typeLabel} | Fecha: ${new Date(att.event.date).toLocaleDateString('es-ES', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        })}`);

                    if (att.event.startTime)
                        doc.text(`Horario: ${att.event.startTime}${att.event.endTime ? ' - ' + att.event.endTime : ''}`);

                    if (att.event.location)
                        doc.text(`Lugar: ${att.event.location}`);

                    // Texto "Estado:" y almacenar posición
                    doc.font('Helvetica-Bold')
                        .fillColor('#111827')
                        .text('Estado: ', { continued: true });

                    const chipY = doc.y;   // <-- guarda la altura actual
                    const chipX = doc.x;   // <-- guarda la posición donde terminó "Estado: "

                    let statusText = '';
                    let statusColor = '#6b7280';

                    if (att.status === 'asistio') { statusText = 'ASISTIÓ'; statusColor = '#059669'; }
                    else if (att.status === 'falto') { statusText = 'FALTÓ'; statusColor = '#dc2626'; }
                    else if (att.status === 'justificado') { statusText = 'JUSTIFICADO'; statusColor = '#d97706'; }

                    // ancho dinámico según texto
                    const paddingX = 10;
                    const textWidth = doc.widthOfString(statusText);
                    const chipWidth = textWidth + paddingX * 2;

                    // fondo del chip
                    doc.roundedRect(chipX, chipY - 2, chipWidth, 14, 7).fill(statusColor);

                    // texto centrado
                    doc
                        .fillColor('#ffffff')
                        .font('Helvetica-Bold')
                        .fontSize(9)
                        .text(statusText, chipX + paddingX, chipY - 1);

                    // reset color
                    doc.fillColor('#000000').font('Helvetica');


                    if (att.arrivalTime) doc.text(`Hora de llegada: ${att.arrivalTime}`);
                    if (att.departureTime) doc.text(`Hora de salida: ${att.departureTime}`);
                    if (att.justification) doc.fontSize(9).font('Helvetica-Oblique').text(`Justificación: ${att.justification}`, { indent: 10 });
                    if (att.notes) doc.fontSize(9).font('Helvetica-Oblique').text(`Notas: ${att.notes}`, { indent: 10 });
                    if (att.event.organizer) doc.fontSize(9).text(`Organizado por: ${att.event.organizer.name} ${att.event.organizer.apellido || ''}`);

                    doc.fontSize(10);
                    doc.moveDown(0.5);

                    if (index < attendances.length - 1) {
                        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#e5e7eb');
                        doc.moveDown(0.5);
                    }
                });
            }


            // ================= FOOTER =================
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).fillColor('#6b7280')
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
