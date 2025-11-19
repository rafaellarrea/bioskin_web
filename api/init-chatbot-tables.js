import { initChatbotDatabase } from '../lib/neon-chatbot-db-vercel.js';

/**
 * ENDPOINT PARA INICIALIZAR TABLAS DEL CHATBOT
 * GET /api/init-chatbot-tables
 * 
 * Crea todas las tablas necesarias si no existen:
 * - chat_conversations
 * - chat_messages  
 * - chatbot_tracking
 * - chatbot_templates
 * - chatbot_app_states
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa GET o POST' });
  }

  try {
    console.log('🚀 Iniciando creación de tablas del chatbot...');
    
    const stats = await initChatbotDatabase();
    
    return res.status(200).json({
      success: true,
      message: '✅ Todas las tablas del chatbot fueron creadas exitosamente',
      tables: [
        'chat_conversations',
        'chat_messages',
        'chatbot_tracking',
        'chatbot_templates',
        'chatbot_app_states'
      ],
      indexes: [
        'idx_session_messages',
        'idx_active_sessions',
        'idx_tracking_session',
        'idx_tracking_type',
        'idx_app_states_timestamp',
        'idx_conversation_preferences'
      ],
      statistics: stats,
      timestamp: new Date().toISOString(),
      nextSteps: [
        'Las tablas están listas para usar',
        'Envía un mensaje al bot de WhatsApp para crear la primera conversación',
        'Visita /chatbot-manager.html para ver las conversaciones'
      ]
    });

  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al crear las tablas',
      details: error.message,
      hint: 'Verifica que POSTGRES_URL esté configurado correctamente en Vercel'
    });
  }
}
