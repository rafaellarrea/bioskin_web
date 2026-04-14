import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Pool } = require('pg');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error('No database connection string found');
  process.exit(1);
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Connected to Neon. Running migration...');

    await client.query('ALTER TABLE technical_service_documents ADD COLUMN IF NOT EXISTS client_cedula VARCHAR(20)');
    console.log('Added column: client_cedula VARCHAR(20)');

    await client.query('ALTER TABLE technical_service_documents ADD COLUMN IF NOT EXISTS client_center VARCHAR(200)');
    console.log('Added column: client_center VARCHAR(200)');

    const cols = await client.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'technical_service_documents' ORDER BY ordinal_position"
    );
    console.log('\nCurrent table schema:');
    cols.rows.forEach(r => console.log('  -', r.column_name, '(' + r.data_type + ')'));

    console.log('\nMigration completed successfully.');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
