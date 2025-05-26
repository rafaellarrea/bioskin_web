const { google } = require('googleapis');
const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Faltan campos requeridos.' });
  }

  const lines = message.split('\n');
  const phone = lines[0]?.replace('Teléfono: ', '').trim();
  const service = lines[1]?.replace('Servicio: ', '').trim();
  const date = lines[2]?.replace('Fecha: ', '').trim();
  const time = lines[3]?.replace('Hora: ', '').trim();

  const startDateTime = new Date(`${date}T${time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);

  try {
    // 1. Crear evento en Google Calendar
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GCAL_CLIENT_EMAIL,
        private_key: process.env.GCAL_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GCAL_CALENDAR_ID;

    const event = {
      summary: `Cita - ${name}`,
      description: `Paciente: ${name}\nCorreo: ${email}\nTeléfono: ${phone}\nServicio: ${service}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/Guayaquil',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/Guayaquil',
      },
      attendees: [{ email }],
    };

    await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });

    // 2. Enviar correos usando nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const bioskinMessage = {
      from: process.env.EMAIL_USER,
      to: 'salud.bioskin@gmail.com',
      subject: `📩 Nueva solicitud de cita de ${name}`,
      text: message,
    };

    const confirmationMessage = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `✅ Confirmación de tu cita en BIOSKIN`,
      text: `Hola ${name},\n\nHemos recibido tu solicitud de cita con los siguientes detalles:\n\n${message}\n\nNos contactaremos contigo para confirmar.\n\nGracias por confiar en BIOSKIN.`,
    };

    await transporter.sendMail(bioskinMessage);
    await transporter.sendMail(confirmationMessage);

    res.status(200).json({ message: 'Solicitud enviada y evento creado.' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error al enviar solicitud o crear evento' });
  }
}
