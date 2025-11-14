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
        is_active BOOLEAN DEFAULT true,
        preferences JSONB DEFAULT '{}'
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

    // Nueva: Tabla de tracking events
    console.log('📋 Creando tabla chatbot_tracking...');
    await sql`
      CREATE TABLE IF NOT EXISTS chatbot_tracking (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255),
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Tabla chatbot_tracking lista');

    // Nueva: Tabla de templates
    console.log('📋 Creando tabla chatbot_templates...');
    await sql`
      CREATE TABLE IF NOT EXISTS chatbot_templates (
        id SERIAL PRIMARY KEY,
        template_id VARCHAR(255) UNIQUE NOT NULL,
        category VARCHAR(100),
        status VARCHAR(50),
        template_data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Tabla chatbot_templates lista');

    // Nueva: Tabla de estados de aplicación
    console.log('📋 Creando tabla chatbot_app_states...');
    await sql`
      CREATE TABLE IF NOT EXISTS chatbot_app_states (
        id SERIAL PRIMARY KEY,
        state_type VARCHAR(100) NOT NULL,
        state JSONB NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Tabla chatbot_app_states lista');

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
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tracking_session 
      ON chatbot_tracking(session_id, timestamp DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tracking_type 
      ON chatbot_tracking(event_type, timestamp DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_app_states_timestamp 
      ON chatbot_app_states(timestamp DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_conversation_preferences 
      ON chat_conversations USING GIN (preferences)
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
  
  // WARM-UP DESHABILITADO: Causa timeouts en Neon free tier
  // La solución actual es usar FallbackStorage en memoria
  
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Intento ${attempt}/${maxRetries} - Ejecutando query SQL...`);
      
      // Timeout más corto (4s) para detectar cold start rápido
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
        setTimeout(() => reject(new Error('Query timeout después de 4s')), 4000)
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
        console.log(`⏳ Reintentar inmediatamente (${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Solo 0.5s de espera
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

/**
 * Guarda un evento de tracking
 */
export async function saveTrackingEvent(sessionId, eventType, eventData) {
  console.log(`📊 Guardando tracking: ${eventType}`);
  
  try {
    await sql`
      INSERT INTO chatbot_tracking (session_id, event_type, event_data)
      VALUES (${sessionId}, ${eventType}, ${JSON.stringify(eventData)})
    `;
    console.log('✅ Tracking guardado');
  } catch (error) {
    console.error('❌ Error guardando tracking:', error);
    // No fallar si el tracking falla
  }
}

/**
 * Guarda o actualiza un template
 */
export async function upsertTemplate(templateId, category, status, templateData) {
  console.log(`📋 Actualizando template: ${templateId}`);
  
  try {
    await sql`
      INSERT INTO chatbot_templates (template_id, category, status, template_data, updated_at)
      VALUES (${templateId}, ${category}, ${status}, ${JSON.stringify(templateData)}, NOW())
      ON CONFLICT (template_id) 
      DO UPDATE SET 
        category = EXCLUDED.category,
        status = EXCLUDED.status,
        template_data = EXCLUDED.template_data,
        updated_at = NOW()
    `;
    console.log('✅ Template actualizado');
  } catch (error) {
    console.error('❌ Error actualizando template:', error);
  }
}

/**
 * Guarda un estado de aplicación
 */
export async function saveAppState(stateType, state) {
  console.log(`🔄 Guardando estado: ${stateType}`);
  
  try {
    await sql`
      INSERT INTO chatbot_app_states (state_type, state)
      VALUES (${stateType}, ${JSON.stringify(state)})
    `;
    console.log('✅ Estado guardado');
  } catch (error) {
    console.error('❌ Error guardando estado:', error);
  }
}

/**
 * Actualiza preferencias de usuario
 */
export async function updateUserPreferences(sessionId, preferences) {
  console.log(`⚙️ Actualizando preferencias para: ${sessionId}`);
  
  try {
    await sql`
      UPDATE chat_conversations
      SET preferences = ${JSON.stringify(preferences)}
      WHERE session_id = ${sessionId}
    `;
    console.log('✅ Preferencias actualizadas');
  } catch (error) {
    console.error('❌ Error actualizando preferencias:', error);
  }
}
