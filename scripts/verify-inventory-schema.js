import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Pool } = require('pg');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ No database connection string found');
  process.exit(1);
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function verifySchema() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verifying Inventory Schema...');

    // Check inventory_items columns
    const itemsCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_items' AND column_name = 'sanitary_registration';
    `);
    
    if (itemsCols.rows.length > 0) {
      console.log('✅ inventory_items.sanitary_registration exists:', itemsCols.rows[0].data_type);
    } else {
      console.error('❌ inventory_items.sanitary_registration MISSING');
    }

    // Check inventory_batches columns
    const batchCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_batches' AND column_name IN ('quantity_initial', 'quantity_current');
    `);

    console.log('📊 Batch Quantity Columns:');
    batchCols.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
      if (col.data_type === 'numeric') {
        console.log(`     ✅ Correct type (numeric)`);
      } else {
        console.log(`     ⚠️ Warning: Expected numeric, got ${col.data_type}`);
      }
    });

  } catch (err) {
    console.error('❌ Verification failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

verifySchema();
