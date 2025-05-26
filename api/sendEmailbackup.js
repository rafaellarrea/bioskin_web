
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Faltan datos' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `Formulario BIOSKIN <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      subject: 'Nuevo mensaje del formulario BIOSKIN',
      html: `
        <h3>Nuevo mensaje de ${name}</h3>
        <p><strong>Correo:</strong> ${email}</p>
        <pre style="font-family:inherit; white-space:pre-wrap;">${message}</pre>
      `,
    });

    await transporter.sendMail({
      from: `BIO SKIN Salud y Estética <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Confirmación de tu solicitud de cita',
      html: `
        <p>Hola <strong>${name}</strong>,</p>
        <p>Gracias por contactarnos. Hemos recibido tu solicitud y nos comunicaremos contigo para confirmar tu cita.</p>
        <p><strong>Detalles enviados:</strong></p>
        <pre style="font-family:inherit; white-space:pre-wrap;">${message}</pre>
        <p style="margin-top:20px;">— El equipo de <strong>BIO SKIN</strong></p>
      `,
    });

    const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf8');
    const credentials = JSON.parse(decoded);

    const auth = new google.auth.JWT(
      credentials.client_email,
      undefined,
      credentials.private_key,
      ['https://www.googleapis.com/auth/calendar']
    );

    const calendar = google.calendar({ version: 'v3', auth });

    const dateMatch = message.match(/Fecha:\s*(\d{4}-\d{2}-\d{2})/);
    const timeMatch = message.match(/Hora:\s*(\d{2}:\d{2})/);
    const date = dateMatch ? dateMatch[1] : null;
    const time = timeMatch ? timeMatch[1] : null;

    console.log("📅 Detalles del evento:", { date, time });

    if (date && time) {
      const startDateTime = new Date(`${date}T${time}:00-05:00`);
      const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

      console.log("➡️ Intentando crear evento desde:", startDateTime.toISOString());

      await calendar.events.insert({
        calendarId: 'salud.bioskin@gmail.com',
        requestBody: {
          summary: `Cita: ${name} - ${email}`,
          description: message,
          start: { dateTime: startDateTime.toISOString() },
          end: { dateTime: endDateTime.toISOString() },
        },
      });

      console.log("✅ Evento creado exitosamente");
    } else {
      console.log("⚠️ No se encontró fecha u hora válida en el mensaje.");
    }

    return res.status(200).json({ success: true, message: 'Todo enviado y registrado con éxito' });
  } catch (err) {
    console.error('❌ Error al procesar la solicitud:', err);
    return res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
  }
}
