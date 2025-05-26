const { google } = require('googleapis');

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

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GCAL_CLIENT_EMAIL,
      private_key: process.env.GCAL_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  const calendar = google.calendar({ version: 'v3', auth });
  const calendarId = process.env.GCAL_CALENDAR_ID;

  const startDateTime = new Date(`${date}T${time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // Duración: 2 horas

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

  try {
    await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });

    res.status(200).json({ message: 'Solicitud enviada correctamente.' });
  } catch (err) {
    console.error('Error creando el evento:', err);
    res.status(500).json({ error: 'Error al crear el evento' });
  }
}
