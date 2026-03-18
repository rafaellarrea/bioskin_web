
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: join(__dirname, '../.env.local') });

// Configuration
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'bioskin_secure_token_2024';
const DEFAULT_URL = 'https://saludbioskin.vercel.app/api/whatsapp-internal'; // URL producción

// 1. Simulación de Verificación GET (Webhook Setup)
async function testWebhookVerification(baseUrl) {
  console.log('\n🔵 Testing Webhook Verification (GET)...');
  const url = `${baseUrl}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=123456789`;
  
  try {
    const response = await fetch(url);
    const text = await response.text();
    
    if (response.status === 200 && text === '123456789') {
      console.log('✅ Webhook Verification PASSED');
    } else {
      console.error('❌ Webhook Verification FAILED');
      console.error(`   Status: ${response.status}`);
      console.error(`   Response: ${text}`);
      console.error(`   Expected: 200 OK with body "123456789"`);
      console.error(`   Check if VERIFY_TOKEN matches Vercel env var.`);
    }
  } catch (error) {
    console.error('❌ Network Error (Verification):', error.message);
  }
}

// 2. Simulación de Mensaje POST (Incoming Message)
async function testIncomingMessage(baseUrl, type = 'text') {
  console.log(`\n🔵 Testing Incoming Message (${type}) POST...`);
  
  // Payload estándar de WhatsApp
  const payload = {
    object: 'whatsapp_business_account',
    entry: [{
      id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: { display_phone_number: '1234567890', phone_number_id: '1234567890' },
          contacts: [{ profile: { name: 'Test User' }, wa_id: '593997061321' }], // Usando número de Rafael (Admin)
          messages: []
        },
        field: 'messages'
      }]
    }]
  };

  // Configurar mensaje según tipo
  if (type === 'text') {
    payload.entry[0].changes[0].value.messages.push({
      from: '593997061321',
      id: 'wamid.test_' + Date.now(),
      timestamp: Math.floor(Date.now() / 1000),
      text: { body: 'Hola, prueba de simulación de webhook' },
      type: 'text'
    });
  } else if (type === 'invoice_image') {
    // Simular imagen (factura) - Nota: No podemos enviar binarios reales fácilmente sin URL pública válida
    // Pero podemos probar que el handler reciba el tipo "image"
    payload.entry[0].changes[0].value.messages.push({
      from: '593997061321',
      id: 'wamid.test_' + Date.now(),
      timestamp: Math.floor(Date.now() / 1000),
      type: 'image',
      image: {
        mime_type: 'image/jpeg',
        sha256: 'fake_sha',
        id: 'fake_media_id'
      }
    });
  }

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Body: ${text.substring(0, 100)}...`);

    if (response.status === 200) {
      console.log('✅ Webhook POST Handled Successfully (200 OK)');
    } else {
      console.error('❌ Webhook POST FAILED');
      console.error(`   Status: ${response.status}`);
      console.error(`   Error Body: ${text}`);
    }

  } catch (error) {
    console.error('❌ Network Error (POST):', error.message);
  }
}

// Ejecución interactiva o automática
const args = process.argv.slice(2);
const targetUrl = args[0] || DEFAULT_URL;

console.log(`🎯 Target URL: ${targetUrl}`);
console.log(`🔑 Using Verify Token: ${VERIFY_TOKEN.substring(0, 3)}...`);

(async () => {
  await testWebhookVerification(targetUrl);
  await testIncomingMessage(targetUrl, 'text');
  // await testIncomingMessage(targetUrl, 'invoice_image'); // Opcional, requiere mockear descarga de medios
})();
