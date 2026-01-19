import nodemailer from "nodemailer";

export const sendTempPasswordEmail = async (email, nombre, tempPassword) => {
  // Verificar si las credenciales de correo existen
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ Credenciales de email no configuradas (EMAIL_USER / EMAIL_PASS). No se envió el correo.");
    // En desarrollo, logueamos la contraseña para poder probar sin email
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Contraseña temporal para ${email}: ${tempPassword}`);
    }
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail", // Ajustar según el proveedor (ej: 'gmail', 'outlook', o host/port)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Priority Group" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Restablecimiento de Contraseña - Priority Group",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #0A5C8D;">Hola ${nombre},</h2>
        <p>Un administrador ha solicitado restablecer tu contraseña en la plataforma.</p>
        <p>Tu nueva contraseña temporal es:</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; font-size: 18px; font-weight: bold; text-align: center; letter-spacing: 1px; margin: 20px 0; border: 1px dashed #ccc;">
          ${tempPassword}
        </div>
        <p>Por favor, inicia sesión con esta contraseña y cámbiala lo antes posible desde tu perfil.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Email de restablecimiento enviado a ${email}`);
};