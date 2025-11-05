import { google } from 'googleapis';

// Función consolidada para todas las operaciones de calendario
export default async function handler(req, res) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;
  const { action } = req.body || req.query;

  // Validar que se proporcione una acción
  if (!action) {
    return res.status(400).json({
      success: false,
      message: 'Acción requerida. Acciones disponibles: getEvents, getDayEvents, getCalendarEvents, blockSchedule, getBlockedSchedules, deleteBlockedSchedule, deleteEvent'
    });
  }

  // Configurar Google Calendar API (común para todas las operaciones)
  let calendar, credentials;
  try {
    console.log(`🔍 API Calendar: Procesando acción "${action}" con método ${method}`);
    
    const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
    if (!credentialsBase64) {
      console.error('❌ GOOGLE_CREDENTIALS_BASE64 no encontrada');
      throw new Error('Google credentials not found');
    }

    credentials = JSON.parse(
      Buffer.from(credentialsBase64, 'base64').toString('utf8')
    );

    // Verificar que las credenciales tienen los campos necesarios
    if (!credentials.client_email || !credentials.private_key || !credentials.calendar_id) {
      console.error('❌ Credenciales incompletas:', {
        hasClientEmail: !!credentials.client_email,
        hasPrivateKey: !!credentials.private_key,
        hasCalendarId: !!credentials.calendar_id
      });
      throw new Error('Credenciales de Google incompletas');
    }

    console.log('✅ Credenciales Google cargadas correctamente');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    calendar = google.calendar({ version: 'v3', auth });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error de configuración del calendario',
      error: error.message
    });
  }

  try {
    switch (action) {
      // Health check para debugging
      case 'health':
        return res.status(200).json({
          success: true,
          message: 'API Calendar funcionando correctamente',
          timestamp: new Date().toISOString(),
          hasCredentials: !!process.env.GOOGLE_CREDENTIALS_BASE64
        });

      // Obtener eventos ocupados para validación de horas
      case 'getEvents':
        return await getEvents(req, res, calendar, credentials);
      
      // Obtener eventos detallados del día
      case 'getDayEvents':
        return await getDayEvents(req, res, calendar, credentials);
      
      // Obtener todos los eventos del calendario
      case 'getCalendarEvents':
        return await getCalendarEvents(req, res, calendar, credentials);
      
      // Bloquear horarios
      case 'blockSchedule':
        if (method !== 'POST') {
          return res.status(405).json({ success: false, message: 'Método no permitido' });
        }
        return await blockSchedule(req, res, calendar, credentials);
      
      // Obtener bloqueos existentes
      case 'getBlockedSchedules':
        return await getBlockedSchedules(req, res, calendar, credentials);
      
      // Eliminar bloqueo específico
      case 'deleteBlockedSchedule':
        if (method !== 'DELETE') {
          return res.status(405).json({ success: false, message: 'Método no permitido' });
        }
        return await deleteBlockedSchedule(req, res, calendar, credentials);
      
      // Eliminar evento individual
      case 'deleteEvent':
        if (method !== 'DELETE') {
          return res.status(405).json({ success: false, message: 'Método no permitido' });
        }
        return await deleteEvent(req, res, calendar, credentials);

      default:
        return res.status(400).json({
          success: false,
          message: 'Acción no válida. Acciones disponibles: health, getEvents, getDayEvents, getCalendarEvents, blockSchedule, getBlockedSchedules, deleteBlockedSchedule, deleteEvent'
        });
    }
  } catch (error) {
    console.error('❌ Error en operación de calendario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}

// Función para obtener eventos ocupados (original getEvents.js)
async function getEvents(req, res, calendar, credentials) {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: "Fecha requerida" });

  const start = `${date}T00:00:00-05:00`;
  const end = `${date}T23:59:59-05:00`;

  const events = await calendar.events.list({
    calendarId: credentials.calendar_id,
    timeMin: start,
    timeMax: end,
    singleEvents: true,
    orderBy: "startTime",
  });

  const occupied = events.data.items.map((e) => ({
    start: e.start.dateTime,
    end: e.end.dateTime,
  }));

  const fullEvents = events.data.items.map((e) => ({
    id: e.id,
    summary: e.summary,
    description: e.description,
    start: e.start.dateTime,
    end: e.end.dateTime,
    location: e.location,
  }));

  res.status(200).json({ 
    occupiedTimes: occupied,
    events: fullEvents 
  });
}

// Función para obtener eventos detallados del día (original getDayEvents.js)
async function getDayEvents(req, res, calendar, credentials) {
  const { date } = req.body;
  if (!date) {
    return res.status(400).json({ success: false, message: 'Fecha requerida' });
  }

  const start = `${date}T00:00:00-05:00`;
  const end = `${date}T23:59:59-05:00`;

  console.log(`🔍 Buscando eventos para el día ${date}`);

  const response = await calendar.events.list({
    calendarId: credentials.calendar_id,
    timeMin: start,
    timeMax: end,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = response.data.items || [];
  console.log(`📋 ${events.length} eventos encontrados para ${date}`);

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
}

// Función para obtener todos los eventos del calendario (original getCalendarEvents.js)
async function getCalendarEvents(req, res, calendar, credentials) {
  const { days = 30 } = req.body;

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + days);

  const timeMin = startDate.toISOString();
  const timeMax = endDate.toISOString();

  console.log(`🔍 Obteniendo eventos del calendario para ${days} días`);

  const response = await calendar.events.list({
    calendarId: credentials.calendar_id,
    timeMin: timeMin,
    timeMax: timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 2500,
  });

  const events = response.data.items || [];
  console.log(`📋 ${events.length} eventos encontrados en total`);

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
      startDateTime: event.start.dateTime || event.start.date,
      endDateTime: event.end.dateTime || event.end.date,
      timeZone: event.start.timeZone || event.end.timeZone || 'America/Guayaquil'
    };
  });

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
      dateRange: { start: timeMin, end: timeMax }
    },
    message: `${formattedEvents.length} eventos encontrados`
  });
}

// Función para bloquear horarios (original blockSchedule.js)
async function blockSchedule(req, res, calendar, credentials) {
  const { date, hours, reason, adminName = 'Administrador BIOSKIN' } = req.body;

  if (!date || !hours || !Array.isArray(hours) || hours.length === 0 || !reason) {
    return res.status(400).json({ 
      success: false, 
      message: 'Fecha, horas y motivo son requeridos' 
    });
  }

  const hourPattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  const validHours = hours.every(hour => hourPattern.test(hour));

  if (!validHours) {
    return res.status(400).json({ 
      success: false, 
      message: 'Formato de hora inválido. Use HH:MM (24h)' 
    });
  }

  const createdEvents = [];
  const errors = [];

  for (const hour of hours) {
    try {
      const [h, m] = hour.split(':').map(Number);
      
      const startDateTime = `${date}T${hour.padStart(5, '0')}:00-05:00`;
      const endHour = h + 1;
      const endDateTime = `${date}T${endHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00-05:00`;
      
      console.log(`🕐 Creando bloqueo: ${startDateTime} - ${endDateTime}`);

      const response = await calendar.events.insert({
        calendarId: credentials.calendar_id,
        requestBody: {
          summary: `🚫 BLOQUEADO: ${reason}`,
          description: `Horario bloqueado por administración.\n\n` +
                      `Motivo: ${reason}\n` +
                      `Bloqueado por: ${adminName}\n` +
                      `Fecha de bloqueo: ${new Date().toLocaleString('es-ES', { timeZone: 'America/Guayaquil' })}\n\n` +
                      `Este horario no está disponible para citas de pacientes.`,
          start: { 
            dateTime: startDateTime, 
            timeZone: "America/Guayaquil" 
          },
          end: { 
            dateTime: endDateTime, 
            timeZone: "America/Guayaquil" 
          },
          status: 'confirmed',
          visibility: 'public',
          transparency: 'opaque'
        }
      });

      createdEvents.push({
        eventId: response.data.id,
        hour: hour,
        summary: response.data.summary,
        htmlLink: response.data.htmlLink
      });

      console.log(`✅ Evento creado: ${response.data.id} para ${hour}`);

    } catch (error) {
      console.error(`❌ Error creando evento para ${hour}:`, error);
      errors.push({
        hour: hour,
        error: error.message
      });
    }
  }

  if (createdEvents.length === 0) {
    return res.status(500).json({
      success: false,
      message: 'No se pudo crear ningún bloqueo',
      errors: errors
    });
  }

  return res.status(200).json({
    success: true,
    message: `${createdEvents.length} horario(s) bloqueado(s) exitosamente`,
    data: {
      createdEvents,
      totalCreated: createdEvents.length,
      totalRequested: hours.length,
      errors: errors
    }
  });
}

// Función para obtener bloqueos existentes (original getBlockedSchedules.js)
async function getBlockedSchedules(req, res, calendar, credentials) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 3);

  const response = await calendar.events.list({
    calendarId: credentials.calendar_id,
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    q: 'BIOSKIN - BLOQUEO',
    singleEvents: true,
    orderBy: 'startTime'
  });

  const blockEvents = response.data.items || [];
  console.log(`📋 ${blockEvents.length} bloqueos encontrados`);

  const groupedBlocks = {};
  
  blockEvents.forEach(event => {
    const eventDate = event.start.dateTime ? 
      event.start.dateTime.split('T')[0] : 
      event.start.date;
    
    const hour = event.start.dateTime ? 
      event.start.dateTime.split('T')[1].substring(0, 5) : 
      '00:00';

    if (!groupedBlocks[eventDate]) {
      groupedBlocks[eventDate] = {
        date: eventDate,
        hours: [],
        reason: event.summary?.replace('🚫 BLOQUEADO: ', '') || 'Sin motivo',
        created: event.created,
        events: []
      };
    }

    groupedBlocks[eventDate].hours.push(hour);
    groupedBlocks[eventDate].events.push({
      id: event.id,
      hour: hour,
      summary: event.summary,
      description: event.description,
      htmlLink: event.htmlLink
    });
  });

  const blocks = Object.values(groupedBlocks);

  return res.status(200).json({
    success: true,
    data: {
      blocks: blocks,
      totalBlocks: blocks.length,
      totalEvents: blockEvents.length
    }
  });
}

// Función para eliminar bloqueo específico (original deleteBlockedSchedule.js)
async function deleteBlockedSchedule(req, res, calendar, credentials) {
  const { eventIds, date, reason } = req.body;

  if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'IDs de eventos requeridos'
    });
  }

  const deletedEvents = [];
  const errors = [];

  for (const eventId of eventIds) {
    try {
      await calendar.events.delete({
        calendarId: credentials.calendar_id,
        eventId: eventId,
      });
      
      deletedEvents.push(eventId);
      console.log(`✅ Evento eliminado: ${eventId}`);
      
    } catch (error) {
      console.error(`❌ Error eliminando evento ${eventId}:`, error);
      errors.push({
        eventId: eventId,
        error: error.message
      });
    }
  }

  return res.status(200).json({
    success: true,
    message: `${deletedEvents.length} evento(s) eliminado(s) exitosamente`,
    data: {
      deletedEvents,
      totalDeleted: deletedEvents.length,
      totalRequested: eventIds.length,
      errors: errors
    }
  });
}

// Función para eliminar evento individual (original deleteEvent.js)
async function deleteEvent(req, res, calendar, credentials) {
  const { eventId, eventType, date } = req.body;

  if (!eventId) {
    return res.status(400).json({ success: false, message: 'ID del evento requerido' });
  }

  console.log(`🗑️ Eliminando evento: ${eventId} (tipo: ${eventType})`);

  try {
    await calendar.events.get({
      calendarId: credentials.calendar_id,
      eventId: eventId,
    });
  } catch (getError) {
    return res.status(404).json({
      success: false,
      message: 'Evento no encontrado'
    });
  }

  await calendar.events.delete({
    calendarId: credentials.calendar_id,
    eventId: eventId,
  });

  console.log(`✅ Evento eliminado exitosamente: ${eventId}`);

  // Enviar notificación por email si es una cita
  if (eventType === 'appointment') {
    try {
      const emailUrl = process.env.VERCEL_URL ? 
        `https://${process.env.VERCEL_URL}/api/sendEmail` : 
        'http://localhost:3000/api/sendEmail';
        
      await fetch(emailUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Sistema BIOSKIN - Cita Cancelada',
          email: 'admin@bioskin.com',
          message: `NOTIFICACIÓN: CITA CANCELADA\n\n` +
                  `Una cita ha sido cancelada desde el panel de administración.\n\n` +
                  `Fecha: ${date}\n` +
                  `ID del evento: ${eventId}\n` +
                  `Cancelada: ${new Date().toLocaleString('es-ES', { timeZone: 'America/Guayaquil' })}\n\n` +
                  `La cita ha sido eliminada de Google Calendar.\n\n` +
                  `Este es un mensaje automático del sistema de gestión BIOSKIN.`,
        }),
      });
      console.log('📧 Notificación de cancelación enviada');
    } catch (emailError) {
      console.error('⚠️ Error enviando notificación de cancelación:', emailError);
    }
  }

  return res.status(200).json({
    success: true,
    message: eventType === 'appointment' 
      ? 'Cita cancelada exitosamente' 
      : 'Bloqueo eliminado exitosamente',
    eventId,
    eventType,
    date
  });
}