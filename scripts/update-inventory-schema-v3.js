import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ No database connection string found');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function updateSchema() {
  const client = await pool.connect();
  try {
    console.log('🔄 Adding group_name column to inventory_items...');
    
    await client.query(`
      ALTER TABLE inventory_items 
      ADD COLUMN IF NOT EXISTS group_name VARCHAR(100);
    `);

    console.log('✅ Schema updated successfully');
  } catch (err) {
    console.error('❌ Error updating schema:', err);
  } finally {
    client.release();
    pool.end();
  }
}

updateSchema();