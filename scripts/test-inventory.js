import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const connectionString = process.env.INVENTORY_DB_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ No database connection string found (checked INVENTORY_DB_URL, NEON_DATABASE_URL, POSTGRES_URL)');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testInventory() {
  console.log('🧪 Testing Inventory Module...');
  const client = await pool.connect();

  try {
    // 1. Create a test item
    // Note: category is a VARCHAR in init-inventory-db.js, not a foreign key
    const itemRes = await client.query(`
      INSERT INTO inventory_items (sku, name, description, category, unit_of_measure)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, ['TEST-001', 'Test Item', 'Description', 'Test Category', 'Unit']);
    const itemId = itemRes.rows[0].id;
    console.log('✅ Item created/found:', itemId);

    // 2. Create a batch
    const batchRes = await client.query(`
      INSERT INTO inventory_batches (item_id, batch_number, expiration_date, quantity_initial, quantity_current)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `, [itemId, 'BATCH-001', '2026-12-31', 100, 100]);
    const batchId = batchRes.rows[0].id;
    console.log('✅ Batch created:', batchId);

    // 3. Create a movement
    const moveRes = await client.query(`
      INSERT INTO inventory_movements (batch_id, movement_type, quantity_change, reason, user_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `, [batchId, 'PURCHASE', 100, 'Initial stock', 'admin']);
    console.log('✅ Movement created:', moveRes.rows[0].id);

    // 4. Clean up
    await client.query('DELETE FROM inventory_movements WHERE batch_id = $1', [batchId]);
    await client.query('DELETE FROM inventory_batches WHERE id = $1', [batchId]);
    await client.query('DELETE FROM inventory_items WHERE id = $1', [itemId]);
    console.log('✅ Cleanup successful');

  } catch (e) {
    console.error('❌ Test failed:', e);
  } finally {
    client.release();
    await pool.end();
  }
}

testInventory();
