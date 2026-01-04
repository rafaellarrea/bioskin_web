import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const CRON_SECRET = process.env.CRON_SECRET;
// Default to production URL if not provided, but allow override
const BASE_URL = process.argv[2] || 'https://bioskin-web.vercel.app'; 

if (!CRON_SECRET) {
  console.error('❌ Error: CRON_SECRET is not defined in .env');
  process.exit(1);
}

async function testCronEndpoint() {
  const url = `${BASE_URL}/api/internal-bot-api?type=internal-chat&action=daily-agenda`;
  console.log(`🚀 Testing Cron Endpoint: ${url}`);
  console.log(`🔑 Using Secret: ${CRON_SECRET.substring(0, 5)}...`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    });

    const status = response.status;
    const rawText = await response.text();
    let data = null;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      // Not JSON
    }

    if (status === 200) {
      console.log('✅ Success! The endpoint accepted the secret.');
      console.log('Response:', data || rawText);
    } else if (status === 401) {
      console.error('❌ Unauthorized. The CRON_SECRET might not match the server configuration.');
      console.error('Response:', data || rawText);
    } else {
      console.error(`⚠️ Unexpected Status: ${status}`);
      console.error('Response:', data || rawText);
    }

  } catch (error) {
    console.error('❌ Network/Script Error:', error.message);
  }
}

testCronEndpoint();
