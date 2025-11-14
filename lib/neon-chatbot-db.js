import { Pool } from '@neondatabase/serverless';

// Validar que existe la URL de conexión
if (!process.env.NEON_DATABASE_URL) {
  console.error('❌ FATAL: NEON_DATABASE_URL no está configurada');
  throw new Error('NEON_DATABASE_URL is required');
}

console.log('🔌 Inicializando conexión a Neon PostgreSQL con Pool...');

// Usar Pool en lugar de neon() para mejor compatibilidad con Vercel
const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL });

console.log('✅ Pool de conexiones Neon inicializado');

/**
 * Inicializa el esquema de base de datos para el chatbot
 */
export async function initChatbotDatabase() {
  try {
    console.log('🔌 Conectando a Neon...');
    console.log('🔑 URL presente:', !!process.env.NEON_DATABASE_URL);
    
    // Tabla de conversaciones
    console.log('📋 Creando tabla chat_conversations...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        phone_number VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        last_message_at TIMESTAMP DEFAULT NOW(),
        total_messages INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true
      )
    `);
    console.log('✅ Tabla chat_conversations lista');

    // Tabla de mensajes
    console.log('📋 Creando tabla chat_messages...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW(),
        tokens_used INT DEFAULT 0,
        message_id VARCHAR(255),
        FOREIGN KEY (session_id) REFERENCES chat_conversations(session_id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla chat_messages lista');

    // Índices para optimización
    console.log('📋 Creando índices...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_session_messages 
      ON chat_messages(session_id, timestamp DESC)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_active_sessions 
      ON chat_conversations(is_active, last_message_at DESC)
    `);
    console.log('✅ Índices creados');

    console.log('✅ Base de datos del chatbot inicializada');
    return { success: true };
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    console.error('❌ Detalle del error:', error.message);
    console.error('❌ Stack:', error.stack);
    throw error;
  }
}

/**
 * Crea o actualiza una sesión de conversación
 */
export async function upsertConversation(sessionId, phoneNumber = null) {
  try {
    console.log(`💾 Upsert conversación: ${sessionId}, tel: ${phoneNumber}`);
    console.log('🔄 Ejecutando query SQL...');
    
    const startTime = Date.now();
    const result = await pool.query(
      `INSERT INTO chat_conversations (session_id, phone_number, last_message_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (session_id) 
       DO UPDATE SET 
         last_message_at = NOW(),
         total_messages = chat_conversations.total_messages + 1,
         is_active = true
       RETURNING *`,
      [sessionId, phoneNumber]
    );
    const duration = Date.now() - startTime;
    
    console.log(`✅ Query completada en ${duration}ms`);
    console.log(`✅ Conversación actualizada, ID: ${result.rows[0]?.id}, total_messages: ${result.rows[0]?.total_messages}`);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error en upsertConversation:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Stack completo:', error.stack);
    throw error;
  }
}

/**
 * Guarda un mensaje en la conversación
 */
export async function saveMessage(sessionId, role, content, tokensUsed = 0, messageId = null) {
  try {
    console.log(`💾 Guardando mensaje: role=${role}, tokens=${tokensUsed}, msgId=${messageId}`);
    const result = await pool.query(
      `INSERT INTO chat_messages (session_id, role, content, tokens_used, message_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [sessionId, role, content, tokensUsed, messageId]
    );
    console.log(`✅ Mensaje guardado con ID: ${result.rows[0]?.id}`);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error guardando mensaje:', error);
    console.error('❌ Detalle:', error.message);
    throw error;
  }
}

/**
 * Obtiene el historial de conversación (últimos N mensajes)
 */
export async function getConversationHistory(sessionId, limit = 20) {
  try {
    console.log(`📖 Obteniendo historial: sessionId=${sessionId}, limit=${limit}`);
    const result = await pool.query(
      `SELECT role, content, timestamp, tokens_used
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [sessionId, limit]
    );
    console.log(`✅ Historial obtenido: ${result.rows.length} mensajes`);
    return result.rows.reverse(); // Orden cronológico
  } catch (error) {
    console.error('❌ Error obteniendo historial:', error);
    console.error('❌ Detalle:', error.message);
    return [];
  }
}

/**
 * Obtiene estadísticas de uso de la base de datos
 */
export async function getDatabaseStats() {
  try {
    const sizeQuery = await pool.query(`
      SELECT 
        pg_database_size(current_database()) as size_bytes,
        pg_size_pretty(pg_database_size(current_database())) as size_pretty
    `);

    const statsQuery = await pool.query(`
      SELECT 
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(*) as total_messages,
        COALESCE(AVG(tokens_used), 0) as avg_tokens,
        SUM(tokens_used) as total_tokens
      FROM chat_messages
      WHERE timestamp > NOW() - INTERVAL '7 days'
    `);

    const activeSessions = await pool.query(`
      SELECT COUNT(*) as active_count
      FROM chat_conversations
      WHERE is_active = true 
      AND last_message_at > NOW() - INTERVAL '24 hours'
    `);

    return {
      storage: {
        sizeBytes: sizeQuery.rows[0].size_bytes,
        sizePretty: sizeQuery.rows[0].size_pretty,
        sizeMB: (sizeQuery.rows[0].size_bytes / (1024 * 1024)).toFixed(2),
        limitMB: 512,
        percentUsed: ((sizeQuery.rows[0].size_bytes / (1024 * 1024)) / 512 * 100).toFixed(1)
      },
      activity: {
        totalSessions: parseInt(statsQuery.rows[0].total_sessions),
        totalMessages: parseInt(statsQuery.rows[0].total_messages),
        avgTokens: parseFloat(statsQuery.rows[0].avg_tokens).toFixed(2),
        totalTokens: parseInt(statsQuery.rows[0].total_tokens),
        activeSessions24h: parseInt(activeSessions.rows[0].active_count)
      }
    };
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    throw error;
  }
}

/**
 * Desactiva una conversación
 */
export async function deactivateConversation(sessionId) {
  try {
    await pool.query(
      `UPDATE chat_conversations
       SET is_active = false
       WHERE session_id = $1`,
      [sessionId]
    );
    return { success: true };
  } catch (error) {
    console.error('❌ Error desactivando conversación:', error);
    throw error;
  }
}
