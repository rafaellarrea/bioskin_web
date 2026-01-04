import { 
  getAllConversations, 
  getConversationMessages,
  saveMessage,
  getTrackingEvents,
  getWhatsAppTemplates,
  getUserPreferences,
  getGlobalSettings,
  updateGlobalSettings,
  getDatabaseStats
} from '../lib/neon-chatbot-db-vercel.js';
import { cleanupService } from '../lib/internal-bot-cleanup.js';
import { FallbackStorage } from '../lib/fallback-storage.js';
import { sql } from '@vercel/postgres';
import { processInternalChatMessage } from '../lib/internal-chat-service.js';
import { googleCalendarService } from '../lib/google-calendar-service.js';
import { sendWhatsAppMessage } from '../lib/admin-notifications.js';
import { STAFF_NUMBERS } from '../lib/config.js';

/**
 * API UNIFICADA PARA HERRAMIENTAS INTERNAS Y CHATBOT
 * 
 * Incluye:
 * - Gestión de Chatbot WhatsApp (Manager/Monitor)
 * - Chat Interno (Staff)
 * - Herramientas AI (Diagnóstico/Protocolos)
 * - Analytics (Básico)
 */
export default async function handler(req, res) {
  // CORS para desarrollo
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { type, action, limit = '50' } = req.query;
    const limitNum = parseInt(limit, 10);

    // ==========================================
    // SECCIÓN: INTERNAL CHAT (Chat Staff)
    // ==========================================
    if (type === 'internal-chat') {
      return await handleInternalChatEndpoints(req, res, action);
    }

    // ==========================================
    // SECCIÓN: AI TOOLS (Diagnóstico/Protocolos)
    // ==========================================
    if (type === 'ai') {
      return await handleAIToolsEndpoints(req, res, action);
    }

    // ==========================================
    // SECCIÓN: ANALYTICS (Web Analytics)
    // ==========================================
    if (type === 'analytics') {
      return await handleAnalyticsEndpoints(req, res);
    }

    // ==========================================
    // SECCIÓN: SETTINGS (Configuración Global)
    // ==========================================
    if (type === 'settings') {
      return await handleSettingsEndpoints(req, res);
    }

    // ==========================================
    // SECCIÓN: STATS (Estadísticas Detalladas)
    // ==========================================
    if (type === 'stats') {
      return await handleStatsEndpoints(req, res);
    }

    // ==========================================
    // SECCIÓN: MANAGER (Gestión de Conversaciones)
    // ==========================================
    if (type === 'manager') {
      return await handleManagerEndpoints(req, res, action);
    }

    // ==========================================
    // SECCIÓN: MONITOR (Estadísticas y Monitoreo)
    // ==========================================
    if (type === 'monitor') {
      return await handleMonitorEndpoints(req, res, action, limitNum);
    }

    // Sin type especificado
    return res.status(400).json({
      success: false,
      error: 'Falta parámetro "type". Usa: manager, monitor, internal-chat, ai, analytics',
      examples: [
        '/api/internal-bot-api?type=manager&action=conversations',
        '/api/internal-bot-api?type=internal-chat&action=list'
      ]
    });

  } catch (error) {
    console.error('❌ [Internal API] Error general:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// ==========================================
// HANDLER: INTERNAL CHAT ENDPOINTS
// ==========================================
async function handleInternalChatEndpoints(req, res, action) {
  // GET: List Conversations, Get Messages, or Cron Jobs
  if (req.method === 'GET') {
    const { sessionId } = req.query;

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
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
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

  // DELETE: Delete Conversation
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

  // POST: Send Message (Chat Logic)
  if (req.method === 'POST') {
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
}

// ==========================================
// HANDLER: AI TOOLS ENDPOINTS
// ==========================================
async function handleAIToolsEndpoints(req, res, action) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
  }

  const { prompt, images, context } = req.body;

  try {
    let systemInstruction = "";
    let userPrompt = prompt;

    if (action === 'diagnosis') {
      systemInstruction = "Eres un asistente experto en dermatología. Analiza las imágenes proporcionadas y describe las condiciones visibles de la piel, posibles afecciones y características relevantes. Responde en español detalladamente. Incluye un descargo de responsabilidad de que esto es una herramienta de ayuda y no sustituye el diagnóstico médico profesional.";
      if (context) {
        userPrompt += `\n\nContexto adicional del paciente: ${context}`;
      }
    } else if (action === 'protocol') {
      systemInstruction = "Eres un asistente clínico experto en aparatología estética (Nd:YAG, CO2, IPL, HIFU, Radiofrecuencia, etc.). Proporciona protocolos detallados, parámetros sugeridos y recomendaciones de seguridad. Responde en español.";
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Construct the payload for Gemini API (REST)
    const models = [
      'gemini-2.0-flash',      // Stable
      'gemini-2.5-flash',      // Newest
      'gemini-1.5-flash'       // Fallback
    ];

    let lastError = null;
    let successResponse = null;

    for (const model of models) {
      try {
        console.log(`[Gemini API] Trying model: ${model}`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const contents = [
          {
            role: "user",
            parts: [
              { text: systemInstruction + "\n\n" + userPrompt }
            ]
          }
        ];

        // Add images if present (for diagnosis)
        if (images && Array.isArray(images)) {
          for (const img of images) {
            contents[0].parts.push({
              inline_data: {
                mime_type: img.mimeType,
                data: img.data
              }
            });
          }
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: contents
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorCode = errorData.error?.code;
          const errorMessage = errorData.error?.message;
          
          console.warn(`[Gemini API] Model ${model} failed: ${errorCode} - ${errorMessage}`);
          
          if (errorCode === 429 || errorCode === 404 || errorMessage?.includes('not found') || errorMessage?.includes('quota')) {
            lastError = new Error(errorMessage);
            continue; 
          } else {
            lastError = new Error(errorMessage);
            continue;
          }
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          throw new Error('No response generated');
        }

        successResponse = text;
        break;

      } catch (error) {
        console.error(`[Gemini API] Error with model ${model}:`, error);
        lastError = error;
      }
    }

    if (successResponse) {
      return res.status(200).json({ result: successResponse });
    } else {
      throw lastError || new Error('All AI models failed to generate a response.');
    }

  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ==========================================
// HANDLER: ANALYTICS ENDPOINTS
// ==========================================
async function handleAnalyticsEndpoints(req, res) {
  try {
    if (req.method === 'GET') {
      // Mock stats for now (since original was in-memory)
      // In future, connect to DB
      const stats = {
        pageViews: { total: 0, daily: {} },
        sessions: { total: 0 },
        startDate: new Date().toISOString()
      };
      return res.status(200).json(stats);
    }

    if (req.method === 'POST') {
      // Log event (mock)
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error en analytics:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ==========================================
// HANDLER: MANAGER ENDPOINTS
// ==========================================
async function handleManagerEndpoints(req, res, action) {
  // GET: Conversaciones
  if (req.method === 'GET' && action === 'conversations') {
    console.log('📋 [Manager] Obteniendo todas las conversaciones...');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const conversations = await getAllConversations();
      
      const enriched = conversations.map(conv => ({
        // Campos originales
        ...conv,
        // Transformación para compatibilidad con frontend
        phone: conv.phone_number || conv.phone,
        lastMessage: conv.last_message || '',
        lastMessageTime: conv.last_message_at || conv.created_at,
        unreadCount: conv.unread_count || 0,
        messageCount: conv.message_count || 0,
        conversationState: conv.conversation_state || 'active',
        // Campos adicionales
        last_message_preview: conv.last_message?.substring(0, 100) || '',
        time_ago: getTimeAgo(conv.last_message_at),
        is_recent: isRecent(conv.last_message_at),
        message_count: conv.message_count || 0
      }));

      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        count: enriched.length,
        conversations: enriched
      });
    } catch (dbError) {
      console.error('❌ [Manager] Error de base de datos:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Error de base de datos al obtener conversaciones',
        details: dbError.message
      });
    }
  }

  // GET: Mensajes de conversación
  if (req.method === 'GET' && action === 'messages') {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Falta parámetro phone'
      });
    }

    console.log(`💬 [Manager] Obteniendo mensajes de ${phone}...`);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const messages = await getConversationMessages(phone);
      
      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        phone,
        count: messages.length,
        messages: messages.map(msg => ({
          // Campos originales
          ...msg,
          // Transformación para compatibilidad con frontend
          id: msg.id,
          phone: phone,
          sender: msg.role === 'user' ? 'user' : (msg.role === 'assistant' ? 'bot' : 'admin'),
          message: msg.message || msg.content || '',
          timestamp: msg.created_at,
          isRead: true, // Asumimos que todos están leídos al cargarlos
          // Campos adicionales
          time_ago: getTimeAgo(msg.created_at),
          is_user: msg.role === 'user'
        }))
      });
    } catch (dbError) {
      console.error('❌ [Manager] Error obteniendo mensajes:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Error de base de datos al obtener mensajes',
        details: dbError.message
      });
    }
  }

  // POST: Enviar mensaje
  if (req.method === 'POST' && action === 'send') {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'Faltan parámetros: phone, message'
      });
    }

    console.log(`📤 [Manager] Enviando mensaje a ${phone}...`);

    // 1. Guardar en BD
    try {
      const conversations = await getAllConversations();
      const conv = conversations.find(c => c.phone_number === phone);
      
      if (!conv) {
        return res.status(404).json({
          success: false,
          error: 'Conversación no encontrada'
        });
      }
      
      await saveMessage(conv.session_id, 'assistant', message, 0, null);
      console.log('✅ [Manager] Mensaje guardado en BD');
    } catch (dbError) {
      console.error('❌ [Manager] Error guardando en BD:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Error guardando mensaje',
        details: dbError.message
      });
    }

    // 2. Enviar por WhatsApp
    let whatsappSent = false;
    let whatsappError = null;

    try {
      const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
      const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

      if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
        throw new Error('Credenciales de WhatsApp no configuradas');
      }

      const whatsappResponse = await fetch(
        `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: message }
          })
        }
      );

      if (whatsappResponse.ok) {
        const result = await whatsappResponse.json();
        console.log('✅ [Manager] Mensaje enviado por WhatsApp:', result);
        whatsappSent = true;
      } else {
        const errorData = await whatsappResponse.text();
        throw new Error(`WhatsApp API error: ${errorData}`);
      }
    } catch (waError) {
      console.error('❌ [Manager] Error enviando por WhatsApp:', waError.message);
      whatsappError = waError.message;
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      saved_to_db: true,
      whatsapp_sent: whatsappSent,
      whatsapp_error: whatsappError,
      message: {
        phone,
        content: message,
        role: 'assistant'
      }
    });
  }

  // GET: Estadísticas de gestión (sin action o con action=stats)
  if (req.method === 'GET' && (!action || action === 'stats')) {
    console.log('📊 [Manager] Obteniendo estadísticas generales...');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const conversations = await getAllConversations();
      
      const stats = {
        total_conversations: conversations.length,
        totalConversations: conversations.length, // Alias para compatibilidad
        active_today: conversations.filter(c => isRecent(c.last_message_at, 24)).length,
        activeToday: conversations.filter(c => isRecent(c.last_message_at, 24)).length, // Alias
        active_this_week: conversations.filter(c => isRecent(c.last_message_at, 168)).length,
        total_messages: conversations.reduce((sum, c) => sum + (c.message_count || 0), 0),
        totalMessages: conversations.reduce((sum, c) => sum + (c.message_count || 0), 0), // Alias
        unreadConversations: conversations.filter(c => c.unread_count > 0).length,
        avg_messages_per_conversation: conversations.length > 0 
          ? (conversations.reduce((sum, c) => sum + (c.message_count || 0), 0) / conversations.length).toFixed(1)
          : 0
      };

      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        stats,
        // También incluir en nivel superior para compatibilidad
        ...stats
      });
    } catch (dbError) {
      console.error('❌ [Manager] Error obteniendo estadísticas:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Error de base de datos al obtener estadísticas',
        details: dbError.message
      });
    }
  }

  // Acción no reconocida
  return res.status(400).json({
    success: false,
    error: 'Acción no válida para type=manager',
    validActions: ['conversations', 'messages', 'send', 'sin action (stats)']
  });
}

// ==========================================
// HANDLER: MONITOR ENDPOINTS
// ==========================================
async function handleMonitorEndpoints(req, res, action, limitNum) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Solo método GET para monitor' });
  }

  // Estadísticas generales (sin action)
  if (!action) {
    console.log('📊 [Monitor] Cargando estadísticas generales...');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const conversations = await getAllConversations();
      
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const conversationsData = {
        total: conversations.length,
        active: conversations.filter(c => 
          c.last_message_at && new Date(c.last_message_at) > last24h
        ).length,
        last24h: conversations.filter(c => 
          c.created_at && new Date(c.created_at) > last24h
        ).length,
        avgMessages: conversations.length > 0
          ? Math.round(
              conversations.reduce((sum, c) => sum + (c.message_count || 0), 0) / conversations.length
            )
          : 0
      };

      const messagesData = {
        last7days: conversations.reduce((sum, c) => {
          const lastMsg = c.last_message_at ? new Date(c.last_message_at) : null;
          return sum + (lastMsg && lastMsg > last7days ? (c.message_count || 0) : 0);
        }, 0)
      };

      let trackingData = { last7days: 0 };
      try {
        const trackingEvents = await getTrackingEvents(limitNum);
        trackingData.last7days = trackingEvents.filter(e => 
          new Date(e.timestamp) > last7days
        ).length;
      } catch (e) {
        console.warn('⚠️ No se pudieron cargar eventos de tracking:', e.message);
      }

      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          conversations: conversationsData,
          messages: messagesData,
          tracking: trackingData
        }
      });
    } catch (dbError) {
      console.error('❌ [Monitor] Error de base de datos:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Error de base de datos',
        details: dbError.message
      });
    }
  }

  // Webhooks
  if (action === 'webhooks') {
    console.log('🔔 [Monitor] Cargando webhooks procesados...');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const trackingEvents = await getTrackingEvents(limitNum);
      
      const webhookTypes = {};
      trackingEvents.forEach(event => {
        const type = event.event_type || 'unknown';
        if (!webhookTypes[type]) {
          webhookTypes[type] = { count: 0, lastEvent: null };
        }
        webhookTypes[type].count++;
        if (!webhookTypes[type].lastEvent || new Date(event.timestamp) > new Date(webhookTypes[type].lastEvent)) {
          webhookTypes[type].lastEvent = event.timestamp;
        }
      });

      const webhooks = Object.entries(webhookTypes).map(([type, data]) => ({
        type,
        count: data.count,
        lastEvent: data.lastEvent
      }));

      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        webhooks
      });
    } catch (error) {
      console.error('❌ [Monitor] Error cargando webhooks:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Tracking events
  if (action === 'tracking') {
    console.log('📈 [Monitor] Cargando eventos de tracking...');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const events = await getTrackingEvents(limitNum);
      
      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        events
      });
    } catch (error) {
      console.error('❌ [Monitor] Error cargando tracking:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Templates
  if (action === 'templates') {
    console.log('📋 [Monitor] Cargando plantillas...');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const templates = await getWhatsAppTemplates();
      
      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        templates
      });
    } catch (error) {
      console.error('❌ [Monitor] Error cargando plantillas:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Preferences
  if (action === 'preferences') {
    console.log('⚙️ [Monitor] Cargando preferencias...');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const preferences = await getUserPreferences();
      
      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        usersWithPreferences: preferences.length,
        preferences
      });
    } catch (error) {
      console.error('❌ [Monitor] Error cargando preferencias:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Conversations recientes
  if (action === 'conversations') {
    console.log('💬 [Monitor] Cargando conversaciones recientes...');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const conversations = await getAllConversations();
      
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentConversations = conversations
        .filter(c => c.last_message_at && new Date(c.last_message_at) > sevenDaysAgo)
        .slice(0, limitNum);

      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        conversations: recentConversations
      });
    } catch (error) {
      console.error('❌ [Monitor] Error cargando conversaciones:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Acción no válida
  return res.status(400).json({
    success: false,
    error: 'Acción no válida para type=monitor',
    validActions: ['webhooks', 'tracking', 'templates', 'preferences', 'conversations']
  });
}

// ==========================================
// HANDLER: SETTINGS ENDPOINTS
// ==========================================
async function handleSettingsEndpoints(req, res) {
  // 1. Verify Auth
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  
  try {
    const session = await sql`
      SELECT * FROM admin_sessions 
      WHERE session_token = ${token} 
      AND is_active = true 
      AND expires_at > NOW()
    `;
    
    if (session.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    if (req.method === 'POST') {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // 2. Handle Request
  try {
    if (req.method === 'GET') {
      const settings = await getGlobalSettings();
      return res.status(200).json(settings);
    } else if (req.method === 'POST') {
      const { chatbotEnabled } = req.body;
      if (typeof chatbotEnabled !== 'boolean') {
        return res.status(400).json({ error: 'Invalid payload' });
      }
      
      await updateGlobalSettings({ chatbotEnabled });
      return res.status(200).json({ success: true, chatbotEnabled });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Settings error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// ==========================================
// HANDLER: STATS ENDPOINTS
// ==========================================
async function handleStatsEndpoints(req, res) {
  try {
    if (req.method === 'GET') {
      console.log('📊 Obteniendo estadísticas del chatbot...');

      let dbStats;
      let usedFallback = false;
      
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        );
        dbStats = await Promise.race([getDatabaseStats(), timeoutPromise]);
      } catch (error) {
        console.warn('⚠️ Base de datos no disponible, usando fallback:', error.message);
        dbStats = FallbackStorage.getStats();
        usedFallback = true;
      }

      const storageCheck = usedFallback 
        ? { needsCleanup: false, currentMB: 0, maxMB: 512, percentUsed: 0, sizePretty: '0 MB' }
        : await cleanupService.checkStorageUsage();

      const stats = {
        timestamp: new Date().toISOString(),
        status: storageCheck.needsCleanup ? 'warning' : (usedFallback ? 'fallback' : 'healthy'),
        dataSource: usedFallback ? 'memory (database unavailable)' : 'database',
        storage: {
          current: `${storageCheck.currentMB} MB`,
          limit: `${storageCheck.maxMB} MB`,
          percentUsed: `${storageCheck.percentUsed}%`,
          needsCleanup: storageCheck.needsCleanup
        },
        database: dbStats,
        system: {
          nodeVersion: process.version,
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime()
        }
      };

      return res.status(200).json(stats);
    } else if (req.method === 'POST') {
      // Mantenimiento manual
      const { action } = req.body;
      
      if (action === 'cleanup') {
        console.log('🧹 Ejecutando limpieza manual...');
        const result = await cleanupService.runCleanup();
        return res.status(200).json(result);
      }
      
      return res.status(400).json({ error: 'Acción no válida' });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function getTimeAgo(dateString) {
  if (!dateString) return 'Nunca';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  return `Hace ${Math.floor(diffDays / 30)} meses`;
}

function isRecent(dateString, hoursThreshold = 24) {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = diffMs / 3600000;

  return diffHours <= hoursThreshold;
}
