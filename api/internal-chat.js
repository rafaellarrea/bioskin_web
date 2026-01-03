import { sql } from '@vercel/postgres';
import { processInternalChatMessage } from '../lib/internal-chat-service.js';
import { googleCalendarService } from '../lib/google-calendar-service.js';
import { sendWhatsAppMessage } from '../lib/admin-notifications.js';
import { STAFF_NUMBERS } from '../lib/config.js';

export default async function handler(req, res) {
  // Allow GET, POST, DELETE
  if (req.method !== 'POST' && req.method !== 'GET' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ==========================================
  // GET: List Conversations, Get Messages, or Cron Jobs
  // ==========================================
  if (req.method === 'GET') {
    const { action, sessionId } = req.query;

    try {
      // --- CRON JOB: DAILY AGENDA ---
      if (action === 'daily-agenda') {
        // Verify Cron Secret
        const authHeader = req.headers['authorization'];
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && req.query.key !== process.env.CRON_SECRET) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        console.log('⏰ Ejecutando Cron Job: Agenda Diaria (Internal Chat Endpoint)');

        // 1. Get Events for Next 3 Days (72h)
        const events = await googleCalendarService.getUpcomingEvents(72);
        
        if (!events || events.length === 0) {
          console.log('ℹ️ No hay eventos para los próximos 3 días');
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

        // Motivational Quote (AI Generated)
        let randomQuote = "¡Que tengas un excelente día!";
        try {
          const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
          if (apiKey) {
            const quotePrompt = "Genera una frase corta, inspiradora y motivadora para un equipo de trabajo de una clínica estética. Enfocada en el éxito, la calidad, el trabajo en equipo y el crecimiento profesional. Solo la frase y el autor (si aplica) o anónimo.";
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: quotePrompt }] }],
                generationConfig: { maxOutputTokens: 100 }
              })
            });

            if (response.ok) {
              const data = await response.json();
              const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (aiText) randomQuote = aiText.trim();
            }
          }
        } catch (err) {
          console.error('Error generating AI quote:', err);
          randomQuote = "\"El éxito es la suma de pequeños esfuerzos repetidos día tras día.\"";
        }
        
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
          totalEvents: events ? events.length : 0 
        });
      }

      if (action === 'list') {
        // List all internal conversations
        const result = await sql`
          SELECT session_id, last_message_at, total_messages, user_info
          FROM chat_conversations 
          WHERE session_id LIKE 'internal_%'
          ORDER BY last_message_at DESC
          LIMIT 50
        `;
        return res.status(200).json({ conversations: result.rows });
      }

      if (action === 'get' && sessionId) {
        // Get messages for a specific session
        const result = await sql`
          SELECT role, content, timestamp
          FROM chat_messages 
          WHERE session_id = ${sessionId}
          ORDER BY timestamp ASC
        `;
        return res.status(200).json({ messages: result.rows });
      }

      return res.status(400).json({ error: 'Invalid action or missing sessionId' });
    } catch (error) {
      console.error('GET Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // DELETE: Delete Conversation
  // ==========================================
  if (req.method === 'DELETE') {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

    try {
      await sql`DELETE FROM chat_conversations WHERE session_id = ${sessionId}`;
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('DELETE Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // POST: Send Message (Chat Logic)
  // ==========================================
  const { message, sessionId, isNewSession, isNewPatient, mode } = req.body;

  try {
    const aiResponse = await processInternalChatMessage({
      message,
      sessionId,
      isNewSession,
      isNewPatient,
      mode
    });

    return res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error('Internal Chat Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

