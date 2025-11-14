/**
 * Script de inicialización de la base de datos del chatbot
 * Ejecutar una sola vez después de configurar NEON_DATABASE_URL
 * 
 * Uso:
 *   node scripts/init-chatbot-db.js
 */

import { initChatbotDatabase, getDatabaseStats } from '../lib/neon-chatbot-db-vercel.js';

async function initializeDatabase() {
  console.log('🔧 Inicializando base de datos del chatbot...\n');

  try {
    // Verificar variable de entorno
    if (!process.env.NEON_DATABASE_URL) {
      throw new Error('❌ NEON_DATABASE_URL no está configurado en las variables de entorno');
    }

    console.log('✅ Variable NEON_DATABASE_URL encontrada');
    console.log('📡 Conectando a Neon PostgreSQL...\n');

    // Crear tablas
    await initChatbotDatabase();
    
    console.log('\n📊 Verificando estado de la base de datos...\n');

    // Obtener estadísticas
    const stats = await getDatabaseStats();

    console.log('✅ Base de datos inicializada correctamente!\n');
    console.log('📈 Estadísticas iniciales:');
    console.log(`   - Tamaño: ${stats.storage.sizePretty} (${stats.storage.percentUsed}% usado)`);
    console.log(`   - Sesiones: ${stats.activity.totalSessions}`);
    console.log(`   - Mensajes: ${stats.activity.totalMessages}`);
    console.log(`   - Sesiones activas (24h): ${stats.activity.activeSessions24h}\n`);

    console.log('🎉 ¡Todo listo para recibir mensajes de WhatsApp!\n');
    console.log('📝 Próximos pasos:');
    console.log('   1. Configurar webhook en Meta Business Manager');
    console.log('   2. Verificar variables WHATSAPP_* en Vercel');
    console.log('   3. Probar enviando mensaje al número de WhatsApp Business\n');

  } catch (error) {
    console.error('\n❌ Error inicializando base de datos:', error.message);
    console.error('\n💡 Soluciones:');
    console.error('   - Verifica que NEON_DATABASE_URL esté correctamente configurado');
    console.error('   - Asegúrate de tener conexión a internet');
    console.error('   - Revisa que la cadena de conexión sea válida');
    console.error('   - Confirma que el proyecto Neon esté activo\n');
    process.exit(1);
  }
}

// Ejecutar inicialización
initializeDatabase();
