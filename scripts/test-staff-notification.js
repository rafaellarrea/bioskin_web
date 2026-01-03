import 'dotenv/config';
import { STAFF_NUMBERS } from '../lib/config.js';
import { sendWhatsAppMessage } from '../lib/admin-notifications.js';

async function testStaffNotifications() {
  console.log('📋 Verificando configuración de notificaciones al staff...');
  
  console.log(`🔢 Números configurados (${STAFF_NUMBERS.length}):`);
  STAFF_NUMBERS.forEach((num, index) => {
    console.log(`   ${index + 1}. ${num}`);
  });

  if (STAFF_NUMBERS.length !== 3) {
    console.warn('⚠️ ADVERTENCIA: Se esperaban 3 números configurados.');
  } else {
    console.log('✅ Cantidad de números correcta (3).');
  }

  console.log('\n🚀 Iniciando prueba de envío...');
  
  const message = "🔔 *TEST DE NOTIFICACIÓN BIOSKIN* 🔔\n\nEsta es una prueba de verificación del sistema de notificaciones diarias para el staff.\n\nSi recibes este mensaje, el sistema está funcionando correctamente. ✅";

  const results = await Promise.allSettled(
    STAFF_NUMBERS.map(number => sendWhatsAppMessage(number, message))
  );

  let successCount = 0;
  results.forEach((result, index) => {
    const number = STAFF_NUMBERS[index];
    if (result.status === 'fulfilled' && result.value === true) {
      console.log(`✅ Mensaje enviado correctamente a ${number}`);
      successCount++;
    } else {
      console.error(`❌ Error enviando a ${number}:`, result.reason || 'Falló el envío');
    }
  });

  console.log(`\n📊 Resumen: ${successCount}/${STAFF_NUMBERS.length} mensajes enviados con éxito.`);
}

testStaffNotifications().catch(console.error);
