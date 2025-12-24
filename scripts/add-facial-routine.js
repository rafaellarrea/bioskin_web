
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ No database connection string found in environment variables.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  try {
    console.log('🔌 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected.');

    console.log('🔄 Adding facial_routine column to medical_history table...');
    await client.query(`
      ALTER TABLE medical_history 
      ADD COLUMN IF NOT EXISTS facial_routine TEXT;
    `);
    
    console.log('✅ Migration successful: facial_routine column added.');
    client.release();
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
