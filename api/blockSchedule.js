import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { date, hours, reason, adminName = 'Administrador BIOSKIN' } = req.body;

  // Validaciones
  if (!date || !hours || !Array.isArray(hours) || hours.length === 0 || !reason) {
    return res.status(400).json({ 
      success: false, 
      message: 'Faltan datos requeridos: date, hours (array), reason' 
    });
  }

  // Validar formato de fecha
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Formato de fecha inválido. Use YYYY-MM-DD' 
    });
  }

  // Validar que la fecha no sea en el pasado
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    return res.status(400).json({ 
      success: false, 
      message: 'No se pueden bloquear fechas en el pasado' 
    });
  }

  // Validar horarios
  const validHours = hours.every(hour => /^\d{2}:\d{2}$/.test(hour));
  if (!validHours) {
    return res.status(400).json({ 
      success: false, 
      message: 'Formato de hora inválido. Use HH:MM (24h)' 
    });
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
    const createdEvents = [];
    const errors = [];

    // Crear evento para cada hora bloqueada
    for (const hour of hours) {
      try {
        const [h, m] = hour.split(':').map(Number);
        
        // Crear fechas en zona horaria de Ecuador (UTC-5)
        // Usar formato ISO string para asegurar zona horaria correcta
        const startDateTime = `${date}T${hour.padStart(5, '0')}:00-05:00`;
        const endHour = h + 1; // Bloqueo de 1 hora
        const endDateTime = `${date}T${endHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00-05:00`;
        
        console.log(`🕐 Creando bloqueo: ${startDateTime} - ${endDateTime}`);

        // Crear evento en Google Calendar
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
            transparency: 'opaque', // Marca el horario como ocupado
            colorId: '11', // Color rojo para bloqueos
            extendedProperties: {
              shared: {
                type: 'blocked_schedule',
                reason: reason,
                blocked_by: adminName,
                blocked_at: new Date().toISOString()
              }
            }
          }
        });

        createdEvents.push({
          hour,
          eventId: response.data.id,
          eventLink: response.data.htmlLink
        });

        console.log(`✅ Horario ${hour} bloqueado exitosamente para ${date}`);

      } catch (hourError) {
        console.error(`❌ Error bloqueando hora ${hour}:`, hourError);
        errors.push({
          hour,
          error: hourError.message
        });
      }
    }

    // Respuesta de éxito
    const successCount = createdEvents.length;
    const errorCount = errors.length;

    if (successCount > 0 && errorCount === 0) {
      return res.status(200).json({
        success: true,
        message: `✅ ${successCount} hora(s) bloqueada(s) exitosamente`,
        data: {
          date,
          reason,
          blockedHours: createdEvents.length,
          events: createdEvents
        }
      });
    } else if (successCount > 0 && errorCount > 0) {
      return res.status(207).json({
        success: true,
        message: `⚠️ ${successCount} hora(s) bloqueada(s), ${errorCount} error(es)`,
        data: {
          date,
          reason,
          blockedHours: successCount,
          events: createdEvents,
          errors: errors
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: `❌ No se pudo bloquear ningún horario`,
        errors: errors
      });
    }

  } catch (error) {
    console.error('❌ Error general al bloquear horarios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al bloquear horarios',
      error: error.message
    });
  }
}