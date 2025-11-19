import { 
  getAllConversations, 
  getConversationMessages,
  saveMessage 
} from '../lib/neon-chatbot-db-vercel.js';

/**
 * API para gestión y monitoreo de chats de WhatsApp
 * Permite leer conversaciones, mensajes y enviar respuestas
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
    const { action } = req.query;

    // ========================================
    // GET /api/chatbot-manager?action=conversations
    // Obtener todas las conversaciones
    // ========================================
    if (req.method === 'GET' && action === 'conversations') {
      console.log('📋 [Manager] Obteniendo todas las conversaciones...');
      
      try {
        // Delay de 1.5 segundos para dar tiempo a la conexión de BD
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const conversations = await getAllConversations();
        
        // Enriquecer con información adicional
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
          details: dbError.message,
          hint: 'Verifica que la base de datos esté inicializada y que POSTGRES_URL esté configurado'
        });
      }
    }

    // ========================================
    // GET /api/chatbot-manager?action=messages&phone=123456789
    // Obtener mensajes de una conversación
    // ========================================
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
        // Delay de 1 segundo para conexión
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

    // ========================================
    // POST /api/chatbot-manager?action=send
    // Enviar mensaje saliente (guardado en BD + intentar envío por WhatsApp)
    // ========================================
    if (req.method === 'POST' && action === 'send') {
      const { phone, message } = req.body;

      if (!phone || !message) {
        return res.status(400).json({
          success: false,
          error: 'Faltan parámetros: phone, message'
        });
      }

      console.log(`📤 [Manager] Enviando mensaje a ${phone}...`);

      // 1. Guardar mensaje en BD como mensaje del asistente
      try {
        // Buscar session_id del teléfono
        const conversations = await getAllConversations();
        const conv = conversations.find(c => c.phone_number === phone);
        
        if (!conv) {
          return res.status(404).json({
            success: false,
            error: 'Conversación no encontrada para este teléfono'
          });
        }
        
        // Guardar mensaje con la firma correcta: (sessionId, role, content, tokensUsed, messageId)
        await saveMessage(conv.session_id, 'assistant', message, 0, null);
        console.log('✅ [Manager] Mensaje guardado en BD');
      } catch (dbError) {
        console.error('❌ [Manager] Error guardando en BD:', dbError);
        return res.status(500).json({
          success: false,
          error: 'Error guardando mensaje en BD',
          details: dbError.message
        });
      }

      // 2. Intentar enviar por WhatsApp Business API
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

    // ========================================
    // GET /api/chatbot-manager (sin action)
    // Estadísticas generales
    // ========================================
    if (req.method === 'GET' && !action) {
      console.log('📊 [Manager] Obteniendo estadísticas generales...');
      
      try {
        // Delay de 1.5 segundos para dar tiempo a la conexión
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
          details: dbError.message,
          hint: 'Verifica que la base de datos esté inicializada'
        });
      }
    }

    // Acción no reconocida
    return res.status(400).json({
      success: false,
      error: 'Acción no válida. Usa: conversations, messages, send o ninguna (stats)'
    });

  } catch (error) {
    console.error('❌ [Manager] Error en chatbot-manager:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================

/**
 * Calcula tiempo transcurrido desde una fecha
 */
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

/**
 * Verifica si una fecha es reciente (últimas X horas)
 */
function isRecent(dateString, hoursThreshold = 24) {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = diffMs / 3600000;

  return diffHours <= hoursThreshold;
}
