/**
 * Script de prueba local del chatbot
 * Simula un mensaje de WhatsApp y verifica la respuesta
 * 
 * Uso:
 *   node scripts/test-chatbot.js "Tu mensaje aquí"
 */

import { 
  initChatbotDatabase, 
  upsertConversation, 
  saveMessage, 
  getConversationHistory 
} from '../lib/neon-chatbot-db-vercel.js';
import { chatbotAI } from '../lib/chatbot-ai-service.js';

async function testChatbot(message) {
  console.log('🤖 Prueba del Chatbot de WhatsApp\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Verificar configuración
    if (!process.env.NEON_DATABASE_URL) {
      throw new Error('NEON_DATABASE_URL no configurado');
    }
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no configurado');
    }

    console.log('✅ Variables de entorno configuradas');
    console.log('📱 Simulando mensaje de WhatsApp...\n');

    // Inicializar DB si es necesario
    await initChatbotDatabase().catch(() => {
      console.log('ℹ️  Base de datos ya inicializada');
    });

    // Crear sesión de prueba
    const sessionId = 'test_session_' + Date.now();
    const phoneNumber = '+5491234567890';

    console.log(`📍 Session ID: ${sessionId}`);
    console.log(`📞 Teléfono: ${phoneNumber}`);
    console.log(`💬 Mensaje: "${message}"\n`);

    // Crear conversación
    await upsertConversation(sessionId, phoneNumber);

    // Guardar mensaje del usuario
    await saveMessage(sessionId, 'user', message);

    // Obtener historial
    const history = await getConversationHistory(sessionId, 20);

    console.log('🧠 Generando respuesta con OpenAI...');
    console.log(`📚 Contexto: ${history.length} mensajes previos\n`);

    // Generar respuesta
    const result = await chatbotAI.generateResponse(message, history);

    // Guardar respuesta
    await saveMessage(sessionId, 'assistant', result.response, result.tokensUsed);

    // Mostrar resultado
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ RESPUESTA DEL CHATBOT:\n');
    console.log(`"${result.response}"\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📊 Estadísticas:');
    console.log(`   - Tokens usados: ${result.tokensUsed}`);
    console.log(`   - Modelo: ${result.model}`);
    console.log(`   - Finish reason: ${result.finishReason || 'N/A'}\n`);

    if (result.error) {
      console.log(`⚠️  Error reportado: ${result.error}\n`);
    }

    console.log('🎉 Prueba completada exitosamente!\n');

  } catch (error) {
    console.error('\n❌ Error en la prueba:', error.message);
    console.error('\n💡 Verifica:');
    console.error('   - Variables de entorno configuradas');
    console.error('   - Conexión a internet activa');
    console.error('   - Créditos disponibles en OpenAI\n');
    process.exit(1);
  }
}

// Obtener mensaje desde argumentos
const message = process.argv.slice(2).join(' ') || 'Hola, quisiera información sobre tratamientos faciales';

// Ejecutar prueba
testChatbot(message);
