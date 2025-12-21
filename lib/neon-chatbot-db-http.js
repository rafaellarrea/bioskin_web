// Configuración de Neon PostgreSQL usando HTTP API directa (sin @neondatabase/serverless)
// Esta versión usa fetch() nativo para evitar problemas de timeout en Vercel serverless

const NEON_DATABASE_URL = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;

if (!NEON_DATABASE_URL) {
  throw new Error('❌ NEON_DATABASE_URL ni POSTGRES_URL están configuradas');
}

// Parsear la connection string para obtener credenciales y host
const parseConnectionString = (uri) => {
  try {
    const url = new URL(uri);
    return {
      user: url.username,
      password: decodeURIComponent(url.password),
      host: url.hostname,
      database: url.pathname.slice(1),
      port: url.port || '5432'
    };
  } catch (error) {
    console.error('❌ Error parseando connection string:', error);
    throw error;
  }
};

const dbConfig = parseConnectionString(NEON_DATABASE_URL);
console.log('✅ Configuración Neon HTTP:', { host: dbConfig.host, database: dbConfig.database });

/**
 * Ejecuta una query SQL usando la API HTTP de Neon
 * Esta función usa fetch() nativo sin dependencias externas
 */
async function executeQuery(sql, params = []) {
  const startTime = Date.now();
  console.log('🔄 Ejecutando query SQL via HTTP...');
  
  try {
    // Usar la API HTTP de Neon (compatible con pg wire protocol via HTTP)
    const apiEndpoint = `https://${dbConfig.host}/sql`;
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${dbConfig.user}:${dbConfig.password}`).toString('base64')}`
      },
      body: JSON.stringify({
        query: sql,
        params: params
      }),
      signal: AbortSignal.timeout(8000) // Timeout de 8 segundos
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`✅ Query completada via HTTP en ${duration}ms`);
    
    // Normalizar respuesta para que sea compatible con pg.Pool
    return {
      rows: Array.isArray(result) ? result : (result.rows || []),
      rowCount: Array.isArray(result) ? result.length : (result.rowCount || 0)
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error en query SQL después de ${duration}ms:`, error.message);
    throw error;
  }
}

/**
 * Inicializa el esquema de base de datos para el chatbot
 */
export async function initChatbotDatabase() {
  try {
    console.log('🔌 Conectando a Neon via HTTP...');
    
    // Tabla de conversaciones
    console.log('📋 Creando tabla chat_conversations...');
    await executeQuery(`
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
    await executeQuery(`
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

    // Índices
    console.log('📋 Creando índices...');
    await executeQuery(`
      CREATE INDEX IF NOT EXISTS idx_session_messages 
      ON chat_messages(session_id, timestamp DESC)
    `);
    await executeQuery(`
      CREATE INDEX IF NOT EXISTS idx_active_sessions 
      ON chat_conversations(is_active, last_message_at DESC)
    `);
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
 */
export async function upsertConversation(sessionId, phoneNumber) {
  const startTime = Date.now();
  console.log(`💾 Upsert conversación: ${sessionId}, tel: ${phoneNumber}`);
  
  try {
    console.log('🔄 Ejecutando query SQL...');
    
    const result = await executeQuery(`
      INSERT INTO chat_conversations (session_id, phone_number, last_message_at, total_messages)
      VALUES ($1, $2, NOW(), 1)
      ON CONFLICT (session_id) 
      DO UPDATE SET 
        last_message_at = NOW(),
        total_messages = chat_conversations.total_messages + 1
      RETURNING *
    `, [sessionId, phoneNumber]);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Query completada en ${duration}ms`);
    
    if (result.rows && result.rows.length > 0) {
      console.log(`✅ Conversación actualizada, ID: ${result.rows[0].id}`);
      return result.rows[0];
    }
    
    throw new Error('No se pudo crear/actualizar la conversación');
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error en upsertConversation después de ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Guarda un mensaje en el historial
 */
export async function saveMessage(sessionId, role, content, tokensUsed = 0, messageId = null) {
  console.log(`💾 Guardando mensaje ${role}: ${content.substring(0, 50)}...`);
  
  try {
    const result = await executeQuery(`
      INSERT INTO chat_messages (session_id, role, content, tokens_used, message_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [sessionId, role, content, tokensUsed, messageId]);
    
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
    const result = await executeQuery(`
      SELECT role, content, timestamp, tokens_used
      FROM chat_messages
      WHERE session_id = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `, [sessionId, limit]);
    
    const messages = result.rows || [];
    console.log(`✅ Historial obtenido: ${messages.length} mensajes`);
    
    // Invertir para orden cronológico (más antiguo primero)
    return messages.reverse();
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
    const sizeResult = await executeQuery(`
      SELECT pg_database_size(current_database()) as size_bytes
    `);
    const sizeBytes = sizeResult.rows[0]?.size_bytes || 0;
    const sizeKB = Math.round(sizeBytes / 1024);
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
    const percentUsed = ((sizeBytes / (512 * 1024 * 1024)) * 100).toFixed(1);

    // Estadísticas de actividad
    const statsResult = await executeQuery(`
      SELECT 
        COUNT(*) as total_sessions,
        SUM(total_messages) as total_messages,
        AVG(total_messages) as avg_messages_per_session,
        COUNT(CASE WHEN is_active THEN 1 END) as active_sessions
      FROM chat_conversations
    `);
    
    const stats = statsResult.rows[0] || {};
    
    // Sesiones activas recientes
    const activeResult = await executeQuery(`
      SELECT COUNT(*) as count
      FROM chat_conversations
      WHERE is_active = true 
      AND last_message_at > NOW() - INTERVAL '24 hours'
    `);
    
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
    const result = await executeQuery(`
      UPDATE chat_conversations
      SET is_active = false
      WHERE session_id = $1
      RETURNING *
    `, [sessionId]);
    
    if (result.rows && result.rows.length > 0) {
      console.log(`✅ Conversación desactivada`);
      return result.rows[0];
    }
    
    console.log('⚠️ Conversación no encontrada');
    return null;
  } catch (error) {
    console.error('❌ Error desactivando conversación:', error);
    throw error;
  }
}
