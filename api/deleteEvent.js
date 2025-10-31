const { google } = require('googleapis');

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { eventId, eventType, date } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, message: 'ID del evento requerido' });
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
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    console.log(`🗑️ Eliminando evento: ${eventId} (tipo: ${eventType})`);

    // Primero verificar que el evento existe
    try {
      const eventToDelete = await calendar.events.get({
        calendarId: credentials.calendar_id,
        eventId: eventId,
      });

      console.log(`📋 Evento encontrado: "${eventToDelete.data.summary}"`);
    } catch (getError) {
      console.error('❌ Error obteniendo evento:', getError);
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    // Eliminar el evento
    await calendar.events.delete({
      calendarId: credentials.calendar_id,
      eventId: eventId,
    });

    console.log(`✅ Evento eliminado exitosamente: ${eventId}`);

    // Enviar notificación por email si es una cita
    if (eventType === 'appointment') {
      try {
        await fetch(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/sendEmail` : 'http://localhost:3000/api/sendEmail', {
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
        // No fallar la operación principal por error de email
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

  } catch (error) {
    console.error('❌ Error eliminando evento:', error);
    
    // Manejo específico de errores de Google Calendar
    if (error.code === 404) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    if (error.code === 410) {
      return res.status(410).json({
        success: false,
        message: 'El evento ya no existe'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}