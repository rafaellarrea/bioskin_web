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

    // 1. Get Events for Next 3 Days (72h)
    const events = await googleCalendarService.getUpcomingEvents(72);
    
    if (!events || events.length === 0) {
      console.log('ℹ️ No hay eventos para los próximos 3 días');
      // Still send a message saying no events
    }

    // 2. Format Message
    const now = new Date();
    const options = { timeZone: 'America/Guayaquil', weekday: 'long', day: 'numeric', month: 'long' };
    const todayStr = now.toLocaleDateString('es-EC', options);
    
    let message = `🌅 *Buenos días, equipo BIOSKIN* ☀️\n\n`;
    message += `📅 *Resumen de Agenda - ${todayStr}*\n\n`;

    // Group by day
    const groupedEvents = {};
    
    // Initialize keys for next 3 days
    for (let i = 0; i < 3; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dayKey = d.toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil', weekday: 'long', day: 'numeric' });
      groupedEvents[dayKey] = [];
    }

    if (events) {
      events.forEach(e => {
        const eventDate = new Date(e.start.dateTime || e.start.date);
        const dayKey = eventDate.toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil', weekday: 'long', day: 'numeric' });
        const timeStr = eventDate.toLocaleTimeString('es-EC', { timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit' });
        const summary = `• *${timeStr}* - ${e.summary}`;
        
        if (groupedEvents[dayKey]) {
          groupedEvents[dayKey].push(summary);
        }
      });
    }

    // Build message body
    Object.keys(groupedEvents).forEach((day, index) => {
      const label = index === 0 ? 'HOY' : (index === 1 ? 'MAÑANA' : day.toUpperCase());
      const dayEvents = groupedEvents[day];
      
      message += `*${label}:*\n`;
      if (dayEvents.length > 0) {
        message += `${dayEvents.join('\n')}\n\n`;
      } else {
        message += `Sin citas programadas.\n\n`;
      }
    });

    // Motivational Quote
    const quotes = [
      "\"El único modo de hacer un gran trabajo es amar lo que haces.\" - Steve Jobs",
      "\"El éxito no es la clave de la felicidad. La felicidad es la clave del éxito.\" - Albert Schweitzer",
      "\"La calidad significa hacerlo bien cuando nadie está mirando.\" - Henry Ford",
      "\"Tu trabajo va a llenar gran parte de tu vida, la única forma de estar realmente satisfecho es hacer lo que creas es un gran trabajo.\" - Steve Jobs",
      "\"El éxito es la suma de pequeños esfuerzos repetidos día tras día.\" - Robert Collier",
      "\"La excelencia no es un acto, sino un hábito.\" - Aristóteles",
      "\"Cree que puedes y casi lo habrás logrado.\" - Theodore Roosevelt",
      "\"El futuro depende de lo que hagas hoy.\" - Mahatma Gandhi",
      "\"No cuentes los días, haz que los días cuenten.\" - Muhammad Ali",
      "\"La mejor forma de predecir el futuro es crearlo.\" - Peter Drucker"
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
    message += `💡 *Frase del día:*\n_${randomQuote}_\n\n`;
    message += `_Asistente Virtual BIOSKIN_ 🤖`;

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
