import { sql } from '@vercel/postgres';

/**
 * ENDPOINT DE PRUEBA - Verificar conexión a PostgreSQL
 * GET /api/test-db-connection
 * 
 * Úsalo para verificar que POSTGRES_URL está configurado correctamente
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido. Usa GET' });
  }

  try {
    console.log('🔍 Probando conexión a PostgreSQL...');
    
    // Test 1: Verificar que POSTGRES_URL existe
    if (!process.env.POSTGRES_URL) {
      return res.status(500).json({
        success: false,
        error: 'POSTGRES_URL no está configurado',
        hint: 'Agrega POSTGRES_URL en Vercel → Settings → Environment Variables',
        instructions: 'Ver docs/FIX-NO-CONVERSACIONES.md para instrucciones completas'
      });
    }

    // Test 2: Intentar consulta simple
    const versionResult = await sql`SELECT version()`;
    console.log('✅ Conexión exitosa:', versionResult.rows[0].version.substring(0, 50));

    // Test 3: Verificar tablas del chatbot existen
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('chat_conversations', 'chat_messages', 'chatbot_tracking')
    `;

    const existingTables = tablesResult.rows.map(r => r.table_name);
    const missingTables = ['chat_conversations', 'chat_messages', 'chatbot_tracking']
      .filter(t => !existingTables.includes(t));

    if (missingTables.length > 0) {
      return res.status(200).json({
        success: false,
        warning: 'Base de datos conectada pero faltan tablas',
        missingTables,
        hint: 'Las tablas se crearán automáticamente al recibir el primer mensaje en WhatsApp',
        postgresConnected: true
      });
    }

    // Test 4: Contar conversaciones
    const convResult = await sql`SELECT COUNT(*) as count FROM chat_conversations`;
    const conversationsCount = parseInt(convResult.rows[0].count);

    // Test 5: Contar mensajes
    const msgResult = await sql`SELECT COUNT(*) as count FROM chat_messages`;
    const messagesCount = parseInt(msgResult.rows[0].count);

    // Test 6: Última actividad
    const lastActivityResult = await sql`
      SELECT MAX(last_message_at) as last_activity 
      FROM chat_conversations
    `;
    const lastActivity = lastActivityResult.rows[0].last_activity;

    return res.status(200).json({
      success: true,
      message: '✅ Base de datos conectada correctamente',
      database: {
        connected: true,
        tablesExist: true,
        allTablesPresent: existingTables
      },
      statistics: {
        conversations: conversationsCount,
        messages: messagesCount,
        lastActivity: lastActivity ? new Date(lastActivity).toISOString() : 'Sin actividad aún'
      },
      nextSteps: conversationsCount === 0 
        ? 'Envía un mensaje al bot de WhatsApp para crear la primera conversación'
        : 'Visita /chatbot-manager.html para ver las conversaciones',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al conectar con la base de datos',
      details: error.message,
      hint: error.message.includes('missing_connection_string')
        ? 'POSTGRES_URL no está configurado en Vercel'
        : 'Verifica que la connection string sea correcta y la BD esté accesible',
      documentation: 'Ver docs/FIX-NO-CONVERSACIONES.md'
    });
  }
}
