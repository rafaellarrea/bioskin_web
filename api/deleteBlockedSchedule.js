import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { eventIds, date, reason } = req.body;

  // Validaciones
  if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Se requiere un array de eventIds para eliminar' 
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
    
    const deletedEvents = [];
    const errors = [];

    // Eliminar cada evento
    for (const eventId of eventIds) {
      try {
        await calendar.events.delete({
          calendarId: credentials.calendar_id,
          eventId: eventId
        });

        deletedEvents.push(eventId);
        console.log(`✅ Evento ${eventId} eliminado exitosamente`);

      } catch (eventError) {
        console.error(`❌ Error eliminando evento ${eventId}:`, eventError);
        errors.push({
          eventId,
          error: eventError.message
        });
      }
    }

    // Respuesta
    const successCount = deletedEvents.length;
    const errorCount = errors.length;

    if (successCount > 0 && errorCount === 0) {
      return res.status(200).json({
        success: true,
        message: `✅ ${successCount} evento(s) eliminado(s) exitosamente`,
        data: {
          deletedEvents,
          date,
          reason
        }
      });
    } else if (successCount > 0 && errorCount > 0) {
      return res.status(207).json({
        success: true,
        message: `⚠️ ${successCount} evento(s) eliminado(s), ${errorCount} error(es)`,
        data: {
          deletedEvents,
          errors,
          date,
          reason
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: `❌ No se pudo eliminar ningún evento`,
        errors: errors
      });
    }

  } catch (error) {
    console.error('❌ Error general al eliminar bloqueos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al eliminar bloqueos',
      error: error.message
    });
  }
}