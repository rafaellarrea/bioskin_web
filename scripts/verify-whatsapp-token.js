
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
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
        }
        env[match[1]] = value;
      }
    }
    return env;
  } catch (err) {
    console.error('⚠️ Could not load .env.local manually:', err.message);
    return process.env; // Fallback to process.env if loaded elsewhere
  }
}

async function verifyToken() {
  const env = await loadEnv();
  const token = env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token) {
    console.error('❌ No WHATSAPP_ACCESS_TOKEN found in environment');
    process.exit(1);
  }

  // Token is too long to print fully
  const tokenLen = token.length;
  const tokenPreview = tokenLen > 10 ? `${token.substring(0, 5)}...${token.substring(tokenLen - 5)}` : token;
  console.log(`🔍 Checking token validity (${tokenPreview})`);

  try {
    // 1. Verify token permissions and validity using debug_token endpoint or /me
    const meUrl = `https://graph.facebook.com/v18.0/me?access_token=${token}`;
    console.log(`🌐 Calling: ${meUrl}`);
    
    // Node.js 18+ has native fetch
    const response = await fetch(meUrl);
    
    if (response.ok) {
        const data = await response.json();
        console.log('✅ Token Status: VALID');
        console.log('🆔 Token Identity (System User ID):', data.id || 'Unknown ID');
        console.log('👤 Name:', data.name || 'Unknown Name');
        
        // 2. Check phone number ID access (if available in env)
        if (phoneId) {
             console.log(`📱 Checking Phone Number ID: ${phoneId}`);
             const phUrl = `https://graph.facebook.com/v18.0/${phoneId}?access_token=${token}`;
             const phResp = await fetch(phUrl);
             
             if (phResp.ok) {
                 const phData = await phResp.json();
                 console.log('✅ Phone Number ID Access: OK');
                 console.log('📞 Number:', phData.display_phone_number);
                 console.log('✅ Quality Rating:', phData.quality_rating);
             } else {
                 console.error('⚠️ Warning: Token valid but failed to access Phone Number ID:', phResp.statusText);
                 const phErr = await phResp.text();
                 console.error('   Details:', phErr);
             }
        } else {
            console.log('⚠️ WHATSAPP_PHONE_NUMBER_ID not set in env, skipping phone check.');
        }

    } else {
      console.error('❌ Token response not 200:', response.status);
      const errData = await response.text();
      console.error('   Error Data:', errData);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Token Verification FAILED (Network Error)');
    console.error('   Error:', error.message);
    process.exit(1);
  }
}

verifyToken();
