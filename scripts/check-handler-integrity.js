
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Force load env
dotenv.config({ path: '.env.local' });

try {
  // Try importing the handler
  console.log('🔄 Loading API Handler...');
  const handler = await import('../api/whatsapp-internal.js');
  console.log('✅ Handler loaded successfully');
  
  if (typeof handler.default === 'function') {
      console.log('✅ Default export is a function');
  } else {
      console.error('❌ Default export IS NOT A FUNCTION');
  }

} catch (err) {
  console.error('❌ FAILED TO LOAD HANDLER');
  console.error(err);
  process.exit(1);
}
