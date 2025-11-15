import { initChatbotDatabase } from '../lib/neon-chatbot-db-vercel.js';

/**
 * Endpoint para inicializar la base de datos del chatbot
 * GET /api/init-chatbot-db
 * 
 * Crea todas las tablas e índices necesarios para el chatbot
 */
export default async function handler(req, res) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método no permitido. Use GET' 
    });
  }

  try {
    console.log('🚀 Iniciando inicialización de base de datos del chatbot...');
    
    await initChatbotDatabase();
    
    console.log('✅ Base de datos inicializada correctamente');
    
    return res.status(200).json({
      success: true,
      message: 'Base de datos del chatbot inicializada exitosamente',
      timestamp: new Date().toISOString(),
      tables: [
        'chat_conversations',
        'chat_messages',
        'chatbot_tracking',
        'chatbot_templates',
        'chatbot_app_states'
      ],
      indices: [
        'idx_session_messages',
        'idx_active_sessions',
        'idx_tracking_session',
        'idx_tracking_type',
        'idx_app_states_timestamp',
        'idx_conversation_preferences'
      ]
    });
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error al inicializar la base de datos',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      hint: 'Verifica que POSTGRES_URL esté configurado correctamente en las variables de entorno'
    });
  }
}
