import { 
  getAllConversations,
  getConversationMessages,
  getTrackingEvents,
  getWhatsAppTemplates,
  getUserPreferences
} from '../lib/neon-chatbot-db-vercel.js';

/**
 * API DE MONITOREO DEL CHATBOT WHATSAPP
 * Proporciona estadísticas, eventos de tracking, plantillas y preferencias
 * 
 * Endpoints:
 * - GET /api/chatbot-monitor - Estadísticas generales
 * - GET /api/chatbot-monitor?action=webhooks - Webhooks procesados
 * - GET /api/chatbot-monitor?action=tracking&limit=50 - Eventos de tracking
 * - GET /api/chatbot-monitor?action=templates - Plantillas de WhatsApp
 * - GET /api/chatbot-monitor?action=preferences - Preferencias de usuarios
 * - GET /api/chatbot-monitor?action=conversations&limit=50 - Conversaciones recientes
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { action, limit = '50' } = req.query;
    const limitNum = parseInt(limit, 10);

    // ========================================
    // ESTADÍSTICAS GENERALES (sin action)
    // ========================================
    if (!action) {
      console.log('📊 [Monitor] Cargando estadísticas generales...');
      
      try {
        // Agregar delay de 1.5 segundos para dar tiempo a la conexión
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const conversations = await getAllConversations();
        
        // Calcular estadísticas
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

        // Tracking events (si hay)
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
          details: dbError.message,
          hint: 'Verifica POSTGRES_URL y que las tablas estén inicializadas. Espera 2-3 segundos para la conexión.'
        });
      }
    }

    // ========================================
    // WEBHOOKS PROCESADOS
    // ========================================
    if (action === 'webhooks') {
      console.log('🔔 [Monitor] Cargando webhooks procesados...');
      
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const trackingEvents = await getTrackingEvents(limitNum);
        
        // Agrupar por tipo de webhook
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

    // ========================================
    // EVENTOS DE TRACKING
    // ========================================
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

    // ========================================
    // PLANTILLAS DE WHATSAPP
    // ========================================
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

    // ========================================
    // PREFERENCIAS DE USUARIOS
    // ========================================
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

    // ========================================
    // CONVERSACIONES RECIENTES
    // ========================================
    if (action === 'conversations') {
      console.log('💬 [Monitor] Cargando conversaciones recientes...');
      
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const conversations = await getAllConversations();
        
        // Filtrar últimos 7 días y limitar resultados
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
      error: 'Acción no válida',
      validActions: ['webhooks', 'tracking', 'templates', 'preferences', 'conversations']
    });

  } catch (error) {
    console.error('❌ [Monitor] Error general:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
