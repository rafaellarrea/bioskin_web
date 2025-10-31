import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    // Configurar Google Calendar API
    const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf8');
    const credentials = JSON.parse(decoded);

    const auth = new google.auth.JWT(
      credentials.client_email,
      undefined,
      credentials.private_key,
      ['https://www.googleapis.com/auth/calendar']
    );

    const calendar = google.calendar({ version: 'v3', auth });

    // Obtener eventos de los próximos 3 meses que sean bloqueos
    const now = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(now.getMonth() + 3);

    const response = await calendar.events.list({
      calendarId: credentials.calendar_id,
      timeMin: now.toISOString(),
      timeMax: threeMonthsLater.toISOString(),
      q: '🚫 BLOQUEADO', // Buscar eventos que contengan el emoji de bloqueo
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100
    });

    const blockedEvents = response.data.items || [];
    
    // Procesar eventos para agrupar por fecha
    const blockedSchedules = {};

    blockedEvents.forEach(event => {
      if (event.summary && event.summary.includes('🚫 BLOQUEADO')) {
        const startDate = new Date(event.start.dateTime || event.start.date);
        const dateKey = startDate.toISOString().split('T')[0];
        
        const hour = startDate.toTimeString().slice(0, 5); // HH:MM format
        const reason = event.summary.replace('🚫 BLOQUEADO: ', '');
        
        if (!blockedSchedules[dateKey]) {
          blockedSchedules[dateKey] = {
            date: dateKey,
            hours: [],
            reason: reason,
            created: event.created || new Date().toISOString(),
            events: []
          };
        }
        
        blockedSchedules[dateKey].hours.push(hour);
        blockedSchedules[dateKey].events.push({
          id: event.id,
          hour: hour,
          summary: event.summary,
          description: event.description,
          htmlLink: event.htmlLink
        });
      }
    });

    // Convertir a array y ordenar por fecha
    const blockedSchedulesList = Object.values(blockedSchedules)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return res.status(200).json({
      success: true,
      data: {
        totalBlocks: blockedSchedulesList.length,
        totalHours: blockedSchedulesList.reduce((total, block) => total + block.hours.length, 0),
        blocks: blockedSchedulesList
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo bloqueos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener bloqueos',
      error: error.message
    });
  }
}