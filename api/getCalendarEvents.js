const { google } = require('googleapis');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { days = 30 } = req.body;

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

    // Calcular rango de tiempo
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);

    // Formatear fechas en zona horaria de Ecuador
    const timeMin = startDate.toISOString();
    const timeMax = endDate.toISOString();

    console.log(`🔍 Obteniendo eventos del calendario para ${days} días`);
    console.log(`📅 Rango: ${timeMin} - ${timeMax}`);

    // Obtener eventos del calendario
    const response = await calendar.events.list({
      calendarId: credentials.calendar_id,
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500, // Máximo permitido por Google Calendar API
    });

    const events = response.data.items || [];
    
    console.log(`📋 ${events.length} eventos encontrados en total`);

    // Formatear eventos con información completa
    const formattedEvents = events.map(event => {
      const isBlockEvent = event.summary?.includes('BIOSKIN - BLOQUEO') || event.summary?.includes('BLOQUEO');
      
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
        // Información adicional
        iCalUID: event.iCalUID,
        sequence: event.sequence,
        etag: event.etag,
        colorId: event.colorId,
        visibility: event.visibility,
        transparency: event.transparency,
        // Información de recurrencia si existe
        recurrence: event.recurrence,
        recurringEventId: event.recurringEventId,
        originalStartTime: event.originalStartTime,
        // Información de tiempo formateada
        startDateTime: event.start.dateTime || event.start.date,
        endDateTime: event.end.dateTime || event.end.date,
        // Información de zona horaria
        timeZone: event.start.timeZone || event.end.timeZone || 'America/Guayaquil'
      };
    });

    // Estadísticas
    const appointmentEvents = formattedEvents.filter(e => e.eventType === 'appointment');
    const blockEvents = formattedEvents.filter(e => e.eventType === 'block');

    return res.status(200).json({
      success: true,
      events: formattedEvents,
      statistics: {
        totalEvents: formattedEvents.length,
        appointments: appointmentEvents.length,
        blocks: blockEvents.length,
        daysQueried: days,
        dateRange: {
          start: timeMin,
          end: timeMax
        }
      },
      message: `${formattedEvents.length} eventos encontrados`
    });

  } catch (error) {
    console.error('❌ Error obteniendo eventos del calendario:', error);
    
    // Manejo específico de errores de Google Calendar
    if (error.code === 403) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado al calendario'
      });
    }

    if (error.code === 404) {
      return res.status(404).json({
        success: false,
        message: 'Calendario no encontrado'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}