import { googleCalendarService } from '../../lib/google-calendar-service.js';
import { sendWhatsAppMessage } from '../../lib/admin-notifications.js';
import { STAFF_NUMBERS } from '../../lib/config.js';

export default async function handler(req, res) {
  // Verify Cron Secret (Vercel automatically adds this header)
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && req.query.key !== process.env.CRON_SECRET) {
    // Allow manual trigger with query param for testing
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('⏰ Ejecutando Cron Job: Agenda Diaria');

    // 1. Get Events for Today and Tomorrow (48h)
    const events = await googleCalendarService.getUpcomingEvents(48);
    
    if (!events || events.length === 0) {
      console.log('ℹ️ No hay eventos para hoy/mañana');
      return res.status(200).json({ message: 'No events found' });
    }

    // 2. Format Message
    const now = new Date();
    const options = { timeZone: 'America/Guayaquil', weekday: 'long', day: 'numeric', month: 'long' };
    const todayStr = now.toLocaleDateString('es-EC', options);
    
    let message = `🌅 *Buenos días, equipo BIOSKIN* ☀️\n\n`;
    message += `📅 *Resumen de Agenda - ${todayStr}*\n\n`;

    // Group by day
    const todayEvents = [];
    const tomorrowEvents = [];
    const todayDate = now.getDate();

    events.forEach(e => {
      const eventDate = new Date(e.start.dateTime || e.start.date);
      const timeStr = eventDate.toLocaleTimeString('es-EC', { timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit' });
      const summary = `• *${timeStr}* - ${e.summary}`;
      
      if (eventDate.getDate() === todayDate) {
        todayEvents.push(summary);
      } else {
        tomorrowEvents.push(summary);
      }
    });

    if (todayEvents.length > 0) {
      message += `*HOY:*\n${todayEvents.join('\n')}\n\n`;
    } else {
      message += `*HOY:* Sin citas programadas.\n\n`;
    }

    if (tomorrowEvents.length > 0) {
      message += `*MAÑANA:*\n${tomorrowEvents.join('\n')}`;
    }

    message += `\n\n_Este es un mensaje automático del Asistente Virtual._ 🤖`;

    // 3. Send to Staff
    console.log(`📤 Enviando notificación a ${STAFF_NUMBERS.length} miembros del staff...`);
    
    const results = await Promise.allSettled(
      STAFF_NUMBERS.map(number => sendWhatsAppMessage(number, message))
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ Notificaciones enviadas: ${successCount}/${STAFF_NUMBERS.length}`);

    return res.status(200).json({ 
      success: true, 
      sentTo: successCount, 
      totalEvents: events.length 
    });

  } catch (error) {
    console.error('❌ Error en Cron Job:', error);
    return res.status(500).json({ error: error.message });
  }
}
