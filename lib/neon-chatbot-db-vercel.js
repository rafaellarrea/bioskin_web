// Configuración usando @vercel/postgres (optimizado para Vercel serverless)
import { sql } from '@vercel/postgres';

console.log('✅ Cliente Vercel Postgres inicializado');

/**
 * Inicializa el esquema de base de datos para el chatbot
 */
export async function initChatbotDatabase() {
  try {
    console.log('🔌 Conectando a base de datos...');
    
    // Tabla de conversaciones
    console.log('📋 Creando tabla chat_conversations...');
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
    console.log('✅ Tabla chat_conversations lista');

    // Tabla de mensajes
    console.log('📋 Creando tabla chat_messages...');
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
    console.log('✅ Tabla chat_messages lista');

    // Índices
    console.log('📋 Creando índices...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_session_messages 
      ON chat_messages(session_id, timestamp DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_active_sessions 
      ON chat_conversations(is_active, last_message_at DESC)
    `;
    console.log('✅ Índices creados');

    const stats = await getDatabaseStats();
    console.log('✅ Base de datos inicializada correctamente!');
    console.log(`📊 Tamaño: ${stats.storage.sizeKB} kB (${stats.storage.percentUsed}% usado)`);
    console.log(`📊 Sesiones: ${stats.activity.totalSessions}, Mensajes: ${stats.activity.totalMessages}`);
    
    return stats;
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    throw error;
  }
}

/**
 * Crea o actualiza una conversación
 * Implementa retry logic para manejar cold starts de Neon
 */
export async function upsertConversation(sessionId, phoneNumber) {
  const startTime = Date.now();
  console.log(`💾 Upsert conversación: ${sessionId}, tel: ${phoneNumber}`);
  
  const maxRetries = 2;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Intento ${attempt}/${maxRetries} - Ejecutando query SQL...`);
      
      // Usar Promise.race para timeout manual
      const queryPromise = sql`
        INSERT INTO chat_conversations (session_id, phone_number, last_message_at, total_messages)
        VALUES (${sessionId}, ${phoneNumber}, NOW(), 1)
        ON CONFLICT (session_id) 
        DO UPDATE SET 
          last_message_at = NOW(),
          total_messages = chat_conversations.total_messages + 1
        RETURNING *
      `;
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout después de 8s')), 8000)
      );
      
      const result = await Promise.race([queryPromise, timeoutPromise]);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Query completada en ${duration}ms (intento ${attempt})`);
      
      if (result.rows && result.rows.length > 0) {
        console.log(`✅ Conversación actualizada, ID: ${result.rows[0].id}`);
        return result.rows[0];
      }
      
      throw new Error('No se pudo crear/actualizar la conversación');
    } catch (error) {
      const duration = Date.now() - startTime;
      lastError = error;
      console.error(`❌ Error en intento ${attempt} después de ${duration}ms:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Esperando 2s antes de reintentar...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  // Si todos los intentos fallaron
  console.error(`❌ Todos los intentos fallaron después de ${Date.now() - startTime}ms`);
  throw lastError;
}

/**
 * Guarda un mensaje en el historial
 */
export async function saveMessage(sessionId, role, content, tokensUsed = 0, messageId = null) {
  console.log(`💾 Guardando mensaje ${role}: ${content.substring(0, 50)}...`);
  
  try {
    const result = await sql`
      INSERT INTO chat_messages (session_id, role, content, tokens_used, message_id)
      VALUES (${sessionId}, ${role}, ${content}, ${tokensUsed}, ${messageId})
      RETURNING *
    `;
    
    if (result.rows && result.rows.length > 0) {
      console.log(`✅ Mensaje guardado, ID: ${result.rows[0].id}`);
      return result.rows[0];
    }
    
    throw new Error('No se pudo guardar el mensaje');
  } catch (error) {
    console.error('❌ Error guardando mensaje:', error);
    throw error;
  }
}

/**
 * Obtiene el historial de conversación
 */
export async function getConversationHistory(sessionId, limit = 20) {
  console.log(`📜 Obteniendo historial de ${sessionId}, últimos ${limit} mensajes`);
  
  try {
    const messages = await sql`
      SELECT role, content, timestamp, tokens_used
      FROM chat_messages
      WHERE session_id = ${sessionId}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;
    
    console.log(`✅ Historial obtenido: ${messages.rows.length} mensajes`);
    
    // Invertir para orden cronológico (más antiguo primero)
    return messages.rows.reverse();
  } catch (error) {
    console.error('❌ Error obteniendo historial:', error);
    return [];
  }
}

/**
 * Obtiene estadísticas de la base de datos
 */
export async function getDatabaseStats() {
  try {
    // Tamaño de la base de datos
    const sizeResult = await sql`
      SELECT pg_database_size(current_database()) as size_bytes
    `;
    const sizeBytes = sizeResult.rows[0]?.size_bytes || 0;
    const sizeKB = Math.round(sizeBytes / 1024);
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
    const percentUsed = ((sizeBytes / (512 * 1024 * 1024)) * 100).toFixed(1);

    // Estadísticas de actividad
    const statsResult = await sql`
      SELECT 
        COUNT(*) as total_sessions,
        SUM(total_messages) as total_messages,
        AVG(total_messages) as avg_messages_per_session,
        COUNT(CASE WHEN is_active THEN 1 END) as active_sessions
      FROM chat_conversations
    `;
    
    const stats = statsResult.rows[0] || {};
    
    // Sesiones activas recientes
    const activeResult = await sql`
      SELECT COUNT(*) as count
      FROM chat_conversations
      WHERE is_active = true 
      AND last_message_at > NOW() - INTERVAL '24 hours'
    `;
    
    const activeCount = activeResult.rows[0]?.count || 0;

    return {
      storage: {
        sizeBytes,
        sizeKB,
        sizeMB,
        percentUsed,
        limit: '512 MB'
      },
      activity: {
        totalSessions: parseInt(stats.total_sessions) || 0,
        totalMessages: parseInt(stats.total_messages) || 0,
        avgMessagesPerSession: parseFloat(stats.avg_messages_per_session || 0).toFixed(2),
        activeSessions: parseInt(stats.active_sessions) || 0,
        activeLast24h: activeCount
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
  console.log(`🔒 Desactivando conversación: ${sessionId}`);
  
  try {
    const result = await sql`
      UPDATE chat_conversations
      SET is_active = false
      WHERE session_id = ${sessionId}
      RETURNING *
    `;
    
    if (result.rows && result.rows.length > 0) {
      console.log(`✅ Conversación desactivada`);
      return result[0];
    }
    
    console.log('⚠️ Conversación no encontrada');
    return null;
  } catch (error) {
    console.error('❌ Error desactivando conversación:', error);
    throw error;
  }
}
