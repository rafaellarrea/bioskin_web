import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Pool } = require('pg');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ No database connection string found in .env (checked NEON_DATABASE_URL, POSTGRES_URL)');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function updateSchema() {
  const client = await pool.connect();
  try {
    console.log('🔄 Updating Inventory Schema...');

    // 1. Add sanitary_registration to inventory_items
    try {
      await client.query(`
        ALTER TABLE inventory_items 
        ADD COLUMN IF NOT EXISTS sanitary_registration VARCHAR(100);
      `);
      console.log('✅ Added sanitary_registration to inventory_items');
    } catch (e) {
      console.log('⚠️ Error adding sanitary_registration (might exist):', e.message);
    }

    // 2. Change quantity columns to NUMERIC to support fractional usage (levels)
    try {
      await client.query(`
        ALTER TABLE inventory_batches 
        ALTER COLUMN quantity_initial TYPE NUMERIC(10, 2),
        ALTER COLUMN quantity_current TYPE NUMERIC(10, 2);
      `);
      console.log('✅ Updated inventory_batches quantity columns to NUMERIC');
    } catch (e) {
      console.log('⚠️ Error updating inventory_batches:', e.message);
    }

    try {
      await client.query(`
        ALTER TABLE inventory_movements 
        ALTER COLUMN quantity_change TYPE NUMERIC(10, 2);
      `);
      console.log('✅ Updated inventory_movements quantity_change to NUMERIC');
    } catch (e) {
      console.log('⚠️ Error updating inventory_movements:', e.message);
    }

    console.log('🎉 Schema update complete!');
  } catch (err) {
    console.error('❌ Schema update failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

updateSchema();
