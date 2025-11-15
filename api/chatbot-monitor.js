import { sql } from '@vercel/postgres';

/**
 * ENDPOINT DE MONITOREO DEL CHATBOT
 * 
 * Funcionalidades:
 * - GET: Estadísticas generales del chatbot
 * - GET ?action=webhooks: Conteo por tipo de webhook procesado
 * - GET ?action=tracking: Eventos de tracking recientes
 * - GET ?action=templates: Estado de plantillas
 * - GET ?action=preferences: Análisis de preferencias de usuarios
 * - GET ?action=conversations: Estadísticas de conversaciones activas
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

  const { action } = req.query;

  try {
    // ==========================================
    // ESTADÍSTICAS GENERALES
    // ==========================================
    if (!action) {
      const [conversationsResult, messagesResult, trackingResult] = await Promise.all([
        sql`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN is_active THEN 1 END) as active,
            COUNT(CASE WHEN last_message_at > NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
            AVG(total_messages) as avg_messages
          FROM chat_conversations
        `,
        sql`
          SELECT COUNT(*) as total
          FROM chat_messages
          WHERE timestamp > NOW() - INTERVAL '7 days'
        `,
        sql`
          SELECT COUNT(*) as total
          FROM chatbot_tracking
          WHERE timestamp > NOW() - INTERVAL '7 days'
        `
      ]);

      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          conversations: {
            total: parseInt(conversationsResult.rows[0]?.total || 0),
            active: parseInt(conversationsResult.rows[0]?.active || 0),
            last24h: parseInt(conversationsResult.rows[0]?.last_24h || 0),
            avgMessages: parseFloat(conversationsResult.rows[0]?.avg_messages || 0).toFixed(2)
          },
          messages: {
            last7days: parseInt(messagesResult.rows[0]?.total || 0)
          },
          tracking: {
            last7days: parseInt(trackingResult.rows[0]?.total || 0)
          }
        }
      });
    }

    // ==========================================
    // ANÁLISIS DE WEBHOOKS PROCESADOS
    // ==========================================
    if (action === 'webhooks') {
      const result = await sql`
        SELECT 
          event_type,
          COUNT(*) as count,
          MAX(timestamp) as last_event
        FROM chatbot_tracking
        WHERE timestamp > NOW() - INTERVAL '7 days'
        GROUP BY event_type
        ORDER BY count DESC
      `;

      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        webhooks: result.rows.map(row => ({
          type: row.event_type,
          count: parseInt(row.count),
          lastEvent: row.last_event
        }))
      });
    }

    // ==========================================
    // EVENTOS DE TRACKING RECIENTES
    // ==========================================
    if (action === 'tracking') {
      const limit = parseInt(req.query.limit || 50);
      
      const result = await sql`
        SELECT 
          id,
          session_id,
          event_type,
          event_data,
          timestamp
        FROM chatbot_tracking
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `;

      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        events: result.rows
      });
    }

    // ==========================================
    // ESTADO DE PLANTILLAS
    // ==========================================
    if (action === 'templates') {
      const result = await sql`
        SELECT 
          template_id,
          category,
          status,
          template_data,
          created_at,
          updated_at
        FROM chatbot_templates
        ORDER BY updated_at DESC
      `;

      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        templates: result.rows
      });
    }

    // ==========================================
    // ANÁLISIS DE PREFERENCIAS
    // ==========================================
    if (action === 'preferences') {
      const result = await sql`
        SELECT 
          session_id,
          phone_number,
          preferences,
          total_messages,
          last_message_at
        FROM chat_conversations
        WHERE preferences != '{}'::jsonb
        ORDER BY last_message_at DESC
      `;

      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        usersWithPreferences: result.rows.length,
        preferences: result.rows
      });
    }

    // ==========================================
    // CONVERSACIONES DETALLADAS
    // ==========================================
    if (action === 'conversations') {
      const limit = parseInt(req.query.limit || 20);
      
      const result = await sql`
        SELECT 
          c.session_id,
          c.phone_number,
          c.created_at,
          c.last_message_at,
          c.total_messages,
          c.is_active,
          c.preferences,
          COUNT(m.id) as message_count
        FROM chat_conversations c
        LEFT JOIN chat_messages m ON c.session_id = m.session_id
        WHERE c.last_message_at > NOW() - INTERVAL '7 days'
        GROUP BY c.session_id, c.phone_number, c.created_at, c.last_message_at, c.total_messages, c.is_active, c.preferences
        ORDER BY c.last_message_at DESC
        LIMIT ${limit}
      `;

      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        conversations: result.rows
      });
    }

    // ==========================================
    // ACCIÓN NO VÁLIDA
    // ==========================================
    return res.status(400).json({
      error: 'Acción no válida',
      validActions: ['webhooks', 'tracking', 'templates', 'preferences', 'conversations']
    });

  } catch (error) {
    console.error('❌ Error en chatbot-monitor:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}
