import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

async function testInternalChat() {
  console.log('🧪 Starting Internal Chat Diagnostics...');

  // 1. Check Environment Variables
  console.log('\n1. Checking Environment Variables:');
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const dbUrl = process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;

  if (apiKey) {
    console.log('  ✅ Gemini API Key found:', apiKey.substring(0, 8) + '...');
  } else {
    console.error('  ❌ Gemini API Key NOT found!');
  }

  if (dbUrl) {
    console.log('  ✅ Database URL found:', dbUrl.substring(0, 20) + '...');
  } else {
    console.error('  ❌ Database URL NOT found!');
  }

  if (!apiKey || !dbUrl) {
    console.error('  ⛔ Stopping test due to missing variables.');
    return;
  }

  // 2. Test Database Connection
  console.log('\n2. Testing Database Connection...');
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false } // Required for Neon/Vercel Postgres
  });

  try {
    const client = await pool.connect();
    console.log('  ✅ Connected to Database!');
    
    // Check tables
    console.log('  🔍 Checking tables...');
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('internal_bot_conversations', 'internal_bot_messages');
    `);
    
    const tables = res.rows.map(r => r.table_name);
    console.log('  Found tables:', tables);

    if (!tables.includes('internal_bot_conversations')) {
      console.warn('  ⚠️ Table internal_bot_conversations MISSING!');
    }
    if (!tables.includes('internal_bot_messages')) {
      console.warn('  ⚠️ Table internal_bot_messages MISSING!');
    }

    client.release();
  } catch (err) {
    console.error('  ❌ Database Connection Failed:', err.message);
  } finally {
    await pool.end();
  }

  // 3. Test Gemini API
  console.log('\n3. Testing Gemini API...');
  const model = 'gemini-flash-latest';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: "Hola, responde con 'OK' si me escuchas." }]
        }]
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(`API Error ${response.status}: ${JSON.stringify(errData)}`);
    }

    const data = await response.json();
    console.log('  🔍 Full Gemini Response:', JSON.stringify(data, null, 2));
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      console.log('  ✅ Gemini API Response:', text.trim());
    } else {
      console.error('  ⚠️ Response received but no text found.');
      if (data.promptFeedback) {
        console.log('  ⚠️ Prompt Feedback:', data.promptFeedback);
      }
    }

  } catch (err) {
    console.error('  ❌ Gemini API Failed:', err.message);
  }

  console.log('\n🏁 Diagnostics Complete.');
}

testInternalChat();
