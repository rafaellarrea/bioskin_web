import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables BEFORE importing services
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testLocalCron() {
  console.log('🚀 Starting Local Cron Debug...');
  
  // Check Env Vars
  console.log('Checking GOOGLE_CREDENTIALS_BASE64...');
  if (process.env.GOOGLE_CREDENTIALS_BASE64) {
    console.log('✅ Present (Length: ' + process.env.GOOGLE_CREDENTIALS_BASE64.length + ')');
  } else {
    console.error('❌ Missing GOOGLE_CREDENTIALS_BASE64');
  }

  // Dynamic import to ensure env vars are loaded
  const { googleCalendarService } = await import('../lib/google-calendar-service.js');

  try {
    console.log('📅 Attempting to fetch events...');
    const events = await googleCalendarService.getUpcomingEvents(72);
    console.log(`✅ Success! Found ${events.length} events.`);
    events.forEach(e => console.log(` - ${e.summary} (${e.start.dateTime})`));
  } catch (error) {
    console.error('❌ Error fetching events:', error);
    if (error.message === 'Calendar service not initialized') {
        console.error('💡 Hint: Check if GOOGLE_CREDENTIALS_BASE64 is valid JSON when decoded.');
    }
  }
}

testLocalCron();
