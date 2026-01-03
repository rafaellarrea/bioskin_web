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

async function initInventoryDB() {
  console.log('🏥 Inicializando tablas de Inventario...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Inventory Items (Catálogo)
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(50) UNIQUE,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        category VARCHAR(50), -- 'Inyectable', 'Consumible', 'Venta', 'Equipamiento'
        unit_of_measure VARCHAR(20) NOT NULL, -- 'Vial', 'Jeringa', 'Unidad', 'Caja', 'mL'
        min_stock_level INTEGER DEFAULT 5,
        requires_cold_chain BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla inventory_items creada/verificada');

    // 2. Inventory Batches (Lotes y Vencimientos)
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_batches (
        id SERIAL PRIMARY KEY,
        item_id INTEGER REFERENCES inventory_items(id) ON DELETE CASCADE,
        batch_number VARCHAR(100) NOT NULL,
        expiration_date DATE NOT NULL,
        quantity_initial INTEGER NOT NULL,
        quantity_current INTEGER NOT NULL,
        cost_per_unit DECIMAL(10, 2),
        status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'depleted', 'quarantine'
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla inventory_batches creada/verificada');

    // 3. Inventory Movements (Kardex/Historial)
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id SERIAL PRIMARY KEY,
        batch_id INTEGER REFERENCES inventory_batches(id),
        movement_type VARCHAR(50) NOT NULL, -- 'PURCHASE', 'CONSUMPTION', 'ADJUSTMENT', 'RETURN', 'EXPIRED'
        quantity_change INTEGER NOT NULL, -- Positive for IN, Negative for OUT
        reason TEXT,
        reference_id VARCHAR(100), -- Link to Patient Record ID or Invoice
        user_id VARCHAR(100), -- Admin user who performed action
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla inventory_movements creada/verificada');

    // Indexes for performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_inventory_batches_item ON inventory_batches(item_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_inventory_batches_expiry ON inventory_batches(expiration_date);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_inventory_movements_batch ON inventory_movements(batch_id);`);

    await client.query('COMMIT');
    console.log('🚀 Inicialización de Inventario completada con éxito');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error inicializando DB:', e);
  } finally {
    client.release();
    await pool.end();
  }
}

initInventoryDB();
