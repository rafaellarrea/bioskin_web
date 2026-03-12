
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadEnv() {
  try {
    const envPath = join(__dirname, '../.env.local');
    const envContent = await readFile(envPath, 'utf-8');
    const lines = envContent.split('\n');
    const env = {};
    for (const line of lines) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
        }
        env[match[1]] = value;
      }
    }
    return env;
  } catch (err) {
    console.error('⚠️ Could not load .env.local manually:', err.message);
    return process.env;
  }
}

async function testSend() {
  const env = await loadEnv();
  const token = env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  // Número de destino (Rafael)
  const recipientPhone = '593997061321'; 

  if (!token || !phoneId) {
    console.error('❌ Missing credentials in .env.local');
    console.error('WHATSAPP_ACCESS_TOKEN:', !!token);
    console.error('WHATSAPP_PHONE_NUMBER_ID:', !!phoneId);
    process.exit(1);
  }

  console.log('🚀 Sending Test Message...');
  console.log('From Phone ID:', phoneId);
  console.log('To:', recipientPhone);

  const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
  
  const payload = {
    messaging_product: 'whatsapp',
    to: recipientPhone,
    type: 'text',
    text: { body: "🔔 Test de conexión desde script local - Si lees esto, el envío funciona." }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Message Sent Successfully!');
      console.log('Message ID:', data.messages?.[0]?.id);
    } else {
      console.error('❌ Failed to send message:', response.status);
      const err = await response.text();
      console.error(err);
    }
  } catch (e) {
    console.error('❌ Network error:', e);
  }
}

testSend();
