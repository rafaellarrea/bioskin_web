import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local if it exists
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

async function main() {
  console.log('🚀 Starting Clinical Database Initialization...');
  
  if (!process.env.NEON_DATABASE_URL) {
    console.error('❌ Error: NEON_DATABASE_URL environment variable is not set.');
    process.exit(1);
  }

  try {
    // Dynamic import to ensure env vars are loaded first
    const { initClinicalDatabase } = await import('../lib/neon-clinical-db.js');
    await initClinicalDatabase();
    console.log('✅ Database initialization completed successfully.');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

main();
