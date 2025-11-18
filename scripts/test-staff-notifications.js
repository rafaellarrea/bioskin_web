/**
 * Script de prueba para el sistema de notificaciones al staff
 * 
 * USO:
 * node scripts/test-staff-notifications.js [tipo]
 * 
 * Tipos disponibles:
 * - appointment: Prueba notificación de cita agendada
 * - referral: Prueba notificación de derivación a doctora
 * - consultation: Prueba notificación de consulta importante
 */

const fetch = require('node:fetch');
require('dotenv').config();

const WEBHOOK_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/api/whatsapp-chatbot`
  : 'http://localhost:3000/api/whatsapp-chatbot';

const TEST_DATA = {
  appointment: {
    eventType: 'appointment',
    data: {
      name: 'Juan Pérez (PRUEBA)',
      service: 'Limpieza Facial Profunda',
      date: '2025-11-25',
      hour: '10:00'
    },
    patientPhone: '+593999999999'
  },
  referral: {
    eventType: 'referral',
    data: {
      name: 'María González (PRUEBA)',
      reason: 'Evaluación de manchas faciales',
      summary: `Usuario: "Tengo manchas en la cara y quiero tratamiento"
Bot: "Le recomiendo una evaluación con la Dra. Daniela"
Usuario: "Sí, por favor conécteme con ella"`
    },
    patientPhone: '+593988888888'
  },
  consultation: {
    eventType: 'consultation',
    data: {
      name: 'Carlos Ramírez (PRUEBA)',
      query: '¿Cuántas sesiones de HIFU necesito para resultados visibles?',
      botResponse: 'Generalmente se recomienda 1-3 sesiones dependiendo del caso'
    },
    patientPhone: '+593977777777'
  }
};

async function testNotification(type = 'appointment') {
  console.log('\n🧪 PRUEBA DE NOTIFICACIÓN AL STAFF\n');
  console.log(`📋 Tipo de prueba: ${type}`);
  console.log(`🌐 URL del webhook: ${WEBHOOK_URL}`);
  
  const testData = TEST_DATA[type];
  
  if (!testData) {
    console.error(`❌ Tipo de prueba inválido: ${type}`);
    console.log(`✅ Tipos válidos: ${Object.keys(TEST_DATA).join(', ')}`);
    process.exit(1);
  }

  // Verificar configuración
  console.log('\n🔍 Verificando configuración...');
  console.log(`✅ WHATSAPP_PHONE_NUMBER_ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID ? 'Configurado' : '❌ FALTANTE'}`);
  console.log(`✅ WHATSAPP_ACCESS_TOKEN: ${process.env.WHATSAPP_ACCESS_TOKEN ? 'Configurado' : '❌ FALTANTE'}`);
  console.log(`✅ WHATSAPP_STAFF_GROUP_ID: ${process.env.WHATSAPP_STAFF_GROUP_ID || '⚠️  No configurado (usará fallback)'}`);

  if (!process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_ACCESS_TOKEN) {
    console.error('\n❌ Faltan credenciales de WhatsApp. Configurar en .env');
    process.exit(1);
  }

  console.log('\n📤 Enviando prueba de notificación...');
  console.log('📄 Datos de prueba:', JSON.stringify(testData, null, 2));

  try {
    // Simular llamada directa a la función de notificación
    // En producción, esto se llama automáticamente desde el webhook
    
    const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const groupId = process.env.WHATSAPP_STAFF_GROUP_ID;

    // Construir mensaje según tipo
    let message = '';
    const patientChatLink = `https://wa.me/${testData.patientPhone.replace(/\D/g, '')}`;

    switch (type) {
      case 'appointment':
        const dateObj = new Date(testData.data.date + 'T00:00:00-05:00');
        const dateFormatted = dateObj.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          weekday: 'long',
          timeZone: 'America/Guayaquil'
        });
        
        message = `🧪 [PRUEBA] 🗓️ *NUEVA CITA AGENDADA*\n\n` +
          `👤 *Paciente:* ${testData.data.name}\n` +
          `📱 *Teléfono:* ${testData.patientPhone}\n` +
          `💆 *Tratamiento:* ${testData.data.service}\n` +
          `📅 *Fecha:* ${dateFormatted}\n` +
          `⏰ *Hora:* ${testData.data.hour}\n\n` +
          `💬 *Chat directo:* ${patientChatLink}`;
        break;
        
      case 'referral':
        message = `🧪 [PRUEBA] 👨‍⚕️ *DERIVACIÓN A DOCTORA*\n\n` +
          `👤 *Paciente:* ${testData.data.name}\n` +
          `📱 *Teléfono:* ${testData.patientPhone}\n` +
          `🔍 *Motivo:* ${testData.data.reason}\n` +
          `📝 *Resumen conversación:*\n${testData.data.summary}\n\n` +
          `💬 *Chat directo:* ${patientChatLink}`;
        break;
        
      case 'consultation':
        message = `🧪 [PRUEBA] ❓ *CONSULTA IMPORTANTE*\n\n` +
          `👤 *Paciente:* ${testData.data.name}\n` +
          `📱 *Teléfono:* ${testData.patientPhone}\n` +
          `💬 *Consulta:* ${testData.data.query}\n` +
          `🤖 *Respuesta bot:* ${testData.data.botResponse}\n\n` +
          `💬 *Chat directo:* ${patientChatLink}`;
        break;
    }

    // Decidir destino
    const targets = groupId && groupId !== 'undefined' 
      ? [{ id: groupId, name: 'Grupo Staff' }]
      : [
          { id: '+593997061321', name: 'Rafael Larrea' },
          { id: '+593998653732', name: 'Daniela Creamer' }
        ];

    console.log(`\n📬 Enviando a ${targets.length} destino(s):`);
    targets.forEach(t => console.log(`   - ${t.name} (${t.id})`));

    // Enviar mensajes
    const results = await Promise.allSettled(
      targets.map(async (target) => {
        const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;
        const payload = {
          messaging_product: 'whatsapp',
          to: target.id,
          type: 'text',
          text: { body: message }
        };

        console.log(`\n📤 Enviando a ${target.name}...`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`${response.status}: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log(`✅ Enviado a ${target.name} - Message ID: ${data.messages[0].id}`);
        return { success: true, target: target.name, data };
      })
    );

    // Mostrar resultados
    console.log('\n📊 RESULTADOS:\n');
    results.forEach((result, index) => {
      const target = targets[index];
      if (result.status === 'fulfilled' && result.value.success) {
        console.log(`✅ ${target.name}: Enviado exitosamente`);
      } else {
        console.log(`❌ ${target.name}: Error - ${result.reason?.message || 'Desconocido'}`);
      }
    });

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    console.log(`\n📈 Total: ${successCount}/${results.length} notificaciones enviadas\n`);

    if (successCount === 0) {
      console.error('❌ Todas las notificaciones fallaron');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error durante la prueba:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Ejecutar prueba
const testType = process.argv[2] || 'appointment';
testNotification(testType);
