import { 
  getAllConversations, 
  getConversationMessages,
  saveMessage,
  getTrackingEvents,
  getWhatsAppTemplates,
  getUserPreferences
} from '../lib/neon-chatbot-db-vercel.js';

/**
 * API UNIFICADA PARA CHATBOT WHATSAPP
 * Gestión de conversaciones + Monitoreo de estadísticas
 * 
 * Reemplaza a chatbot-manager.js y chatbot-monitor.js
 * 
 * ENDPOINTS DE GESTIÓN (Manager):
 * - GET /api/chatbot-api?type=manager&action=conversations - Listar conversaciones
 * - GET /api/chatbot-api?type=manager&action=messages&phone=xxx - Mensajes de conversación
 * - POST /api/chatbot-api?type=manager&action=send - Enviar mensaje
 * - GET /api/chatbot-api?type=manager - Estadísticas de gestión
 * 
 * ENDPOINTS DE MONITOREO (Monitor):
 * - GET /api/chatbot-api?type=monitor - Estadísticas generales
 * - GET /api/chatbot-api?type=monitor&action=webhooks - Webhooks procesados
 * - GET /api/chatbot-api?type=monitor&action=tracking - Eventos de tracking
 * - GET /api/chatbot-api?type=monitor&action=templates - Plantillas WhatsApp
 * - GET /api/chatbot-api?type=monitor&action=preferences - Preferencias usuarios
 * - GET /api/chatbot-api?type=monitor&action=conversations - Conversaciones recientes
 */
export default async function handler(req, res) {
  // CORS para desarrollo
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { type, action, limit = '50' } = req.query;
    const limitNum = parseInt(limit, 10);

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
      error: 'Falta parámetro "type". Usa: manager o monitor',
      examples: [
        '/api/chatbot-api?type=manager&action=conversations',
        '/api/chatbot-api?type=monitor&action=webhooks'
      ]
    });

  } catch (error) {
    console.error('❌ [Chatbot API] Error general:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
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
        ...conv,
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
          ...msg,
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

  // GET: Estadísticas de gestión (sin action)
  if (req.method === 'GET' && !action) {
    console.log('📊 [Manager] Obteniendo estadísticas generales...');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const conversations = await getAllConversations();
      
      const stats = {
        total_conversations: conversations.length,
        active_today: conversations.filter(c => isRecent(c.last_message_at, 24)).length,
        active_this_week: conversations.filter(c => isRecent(c.last_message_at, 168)).length,
        total_messages: conversations.reduce((sum, c) => sum + (c.message_count || 0), 0),
        avg_messages_per_conversation: conversations.length > 0 
          ? (conversations.reduce((sum, c) => sum + (c.message_count || 0), 0) / conversations.length).toFixed(1)
          : 0
      };

      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        stats
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
