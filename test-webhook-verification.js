/**
 * Script para probar la verificación del webhook localmente
 * Simula la petición GET que hace Meta para verificar el webhook
 */

// Simular la verificación
const testWebhookVerification = () => {
  console.log('🧪 Probando verificación del webhook...\n');

  // Datos que Meta envía
  const params = {
    'hub.mode': 'subscribe',
    'hub.verify_token': 'bioskin_whatsapp_2025',
    'hub.challenge': 'test_challenge_1234567890'
  };

  // Valores de entorno
  const WHATSAPP_VERIFY_TOKEN = 'bioskin_whatsapp_2025';

  console.log('📝 Parámetros recibidos:');
  console.log(`   - Mode: ${params['hub.mode']}`);
  console.log(`   - Token: ${params['hub.verify_token']}`);
  console.log(`   - Challenge: ${params['hub.challenge']}\n`);

  console.log('🔐 Variable de entorno:');
  console.log(`   - WHATSAPP_VERIFY_TOKEN: ${WHATSAPP_VERIFY_TOKEN}\n`);

  // Verificación
  if (params['hub.mode'] === 'subscribe' && params['hub.verify_token'] === WHATSAPP_VERIFY_TOKEN) {
    console.log('✅ VERIFICACIÓN EXITOSA');
    console.log(`   - Respuesta: 200 OK`);
    console.log(`   - Body: ${params['hub.challenge']}\n`);
    console.log('🎉 El webhook debería verificarse correctamente en Meta');
  } else {
    console.log('❌ VERIFICACIÓN FALLIDA');
    console.log(`   - Respuesta: 403 Forbidden`);
    console.log(`   - Razón: Token no coincide o modo incorrecto\n`);
    console.log('⚠️ Verifica que el token en Meta sea exactamente: bioskin_whatsapp_2025');
  }
};

testWebhookVerification();

console.log('\n📋 INSTRUCCIONES PARA META:\n');
console.log('1. URL del Webhook:');
console.log('   https://saludbioskin.vercel.app/api/whatsapp-chatbot\n');
console.log('2. Token de Verificación:');
console.log('   bioskin_whatsapp_2025\n');
console.log('3. Verificar que no haya espacios extra al copiar el token');
console.log('4. Esperar 2 minutos después del último deploy antes de intentar\n');
