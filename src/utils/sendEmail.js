const transporter = require("../config/mailer");

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    await transporter.sendMail({
      from: '"SIC - Sistema Integral Comunitario" <sic.notificaciones.app@gmail.com>',
      to,
      subject,
      html,
      attachments,
    });

    console.log("Correo enviado 🚀");
  } catch (error) {
    console.error("Error enviando correo:", error);
    throw error;
  }
};

module.exports = sendEmail;