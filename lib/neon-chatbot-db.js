import { neon } from '@neondatabase/serverless';

// Conexión a Neon PostgreSQL
const sql = neon(process.env.NEON_DATABASE_URL);

/**
 * Inicializa el esquema de base de datos para el chatbot
 */
export async function initChatbotDatabase() {
  try {
    // Tabla de conversaciones
    await sql`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        phone_number VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        last_message_at TIMESTAMP DEFAULT NOW(),
        total_messages INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true
      )
    `;

    // Tabla de mensajes
    await sql`
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
    `;

    // Índices para optimización
    await sql`
      CREATE INDEX IF NOT EXISTS idx_session_messages 
      ON chat_messages(session_id, timestamp DESC)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_active_sessions 
      ON chat_conversations(is_active, last_message_at DESC)
    `;

    console.log('✅ Base de datos del chatbot inicializada');
    return { success: true };
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    throw error;
  }
}

/**
 * Crea o actualiza una sesión de conversación
 */
export async function upsertConversation(sessionId, phoneNumber = null) {
  try {
    const result = await sql`
      INSERT INTO chat_conversations (session_id, phone_number, last_message_at)
      VALUES (${sessionId}, ${phoneNumber}, NOW())
      ON CONFLICT (session_id) 
      DO UPDATE SET 
        last_message_at = NOW(),
        total_messages = chat_conversations.total_messages + 1,
        is_active = true
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error('❌ Error en upsertConversation:', error);
    throw error;
  }
}

/**
 * Guarda un mensaje en la conversación
 */
export async function saveMessage(sessionId, role, content, tokensUsed = 0, messageId = null) {
  try {
    const result = await sql`
      INSERT INTO chat_messages (session_id, role, content, tokens_used, message_id)
      VALUES (${sessionId}, ${role}, ${content}, ${tokensUsed}, ${messageId})
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error('❌ Error guardando mensaje:', error);
    throw error;
  }
}

/**
 * Obtiene el historial de conversación (últimos N mensajes)
 */
export async function getConversationHistory(sessionId, limit = 20) {
  try {
    const messages = await sql`
      SELECT role, content, timestamp, tokens_used
      FROM chat_messages
      WHERE session_id = ${sessionId}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;
    return messages.reverse(); // Orden cronológico
  } catch (error) {
    console.error('❌ Error obteniendo historial:', error);
    return [];
  }
}

/**
 * Obtiene estadísticas de uso de la base de datos
 */
export async function getDatabaseStats() {
  try {
    const sizeQuery = await sql`
      SELECT 
        pg_database_size(current_database()) as size_bytes,
        pg_size_pretty(pg_database_size(current_database())) as size_pretty
    `;

    const statsQuery = await sql`
      SELECT 
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(*) as total_messages,
        COALESCE(AVG(tokens_used), 0) as avg_tokens,
        SUM(tokens_used) as total_tokens
      FROM chat_messages
      WHERE timestamp > NOW() - INTERVAL '7 days'
    `;

    const activeSessions = await sql`
      SELECT COUNT(*) as active_count
      FROM chat_conversations
      WHERE is_active = true 
      AND last_message_at > NOW() - INTERVAL '24 hours'
    `;

    return {
      storage: {
        sizeBytes: sizeQuery[0].size_bytes,
        sizePretty: sizeQuery[0].size_pretty,
        sizeMB: (sizeQuery[0].size_bytes / (1024 * 1024)).toFixed(2),
        limitMB: 512,
        percentUsed: ((sizeQuery[0].size_bytes / (1024 * 1024)) / 512 * 100).toFixed(1)
      },
      activity: {
        totalSessions: parseInt(statsQuery[0].total_sessions),
        totalMessages: parseInt(statsQuery[0].total_messages),
        avgTokens: parseFloat(statsQuery[0].avg_tokens).toFixed(2),
        totalTokens: parseInt(statsQuery[0].total_tokens),
        activeSessions24h: parseInt(activeSessions[0].active_count)
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
    await sql`
      UPDATE chat_conversations
      SET is_active = false
      WHERE session_id = ${sessionId}
    `;
    return { success: true };
  } catch (error) {
    console.error('❌ Error desactivando conversación:', error);
    throw error;
  }
}
