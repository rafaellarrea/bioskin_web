const { google } = require('googleapis');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Fecha requerida' });
    }

    // Configurar Google Calendar API (igual que getEvents.js)
    const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
    if (!credentialsBase64) {
      throw new Error('Google credentials not found');
    }

    const credentials = JSON.parse(
      Buffer.from(credentialsBase64, 'base64').toString('utf8')
    );

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // Calcular rango de tiempo para el día específico (igual que getEvents.js)
    const start = `${date}T00:00:00-05:00`;
    const end = `${date}T23:59:59-05:00`;

    console.log(`🔍 Buscando eventos para el día ${date}`);
    console.log(`📅 Rango: ${start} - ${end}`);

    // Obtener eventos del día (usando mismo calendar_id que getEvents.js)
    const response = await calendar.events.list({
      calendarId: credentials.calendar_id,
      timeMin: start,
      timeMax: end,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    
    console.log(`📋 ${events.length} eventos encontrados para ${date}`);

    // Formatear eventos con información detallada
    const formattedEvents = events.map(event => {
      const isBlockEvent = event.summary?.includes('BIOSKIN - BLOQUEO');
      
      return {
        id: event.id,
        summary: event.summary || 'Sin título',
        description: event.description || '',
        start: event.start,
        end: event.end,
        status: event.status,
        htmlLink: event.htmlLink,
        creator: event.creator,
        organizer: event.organizer,
        attendees: event.attendees || [],
        location: event.location || '',
        eventType: isBlockEvent ? 'block' : 'appointment',
        isBlockEvent,
        created: event.created,
        updated: event.updated,
        // Agregar información de tiempo formateada
        startDateTime: event.start.dateTime || event.start.date,
        endDateTime: event.end.dateTime || event.end.date
      };
    });

    return res.status(200).json({
      success: true,
      events: formattedEvents,
      totalEvents: formattedEvents.length,
      date,
      message: `${formattedEvents.length} eventos encontrados`
    });

  } catch (error) {
    console.error('❌ Error obteniendo eventos del día:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}