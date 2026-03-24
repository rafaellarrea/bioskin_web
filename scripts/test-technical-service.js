
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

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runTest() {
  console.log('🧪 Starting Technical Service DB Test...');
  const client = await pool.connect();
  
  try {
    // 1. Insert Test Record
    const testTicket = `TEST-${Date.now()}`;
    console.log(`📝 Inserting test ticket: ${testTicket}`);
    
    const insertRes = await client.query(`
      INSERT INTO technical_service_documents 
      (ticket_number, document_type, client_name, status, equipment_data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [testTicket, 'reception', 'Test Client', 'pending', JSON.stringify({ brand: 'TestBrand' })]);
    
    const newId = insertRes.rows[0].id;
    console.log(`✅ Inserted record with ID: ${newId}`);

    // 2. Read Back
    const readRes = await client.query('SELECT * FROM technical_service_documents WHERE id = $1', [newId]);
    if (readRes.rows.length > 0 && readRes.rows[0].ticket_number === testTicket) {
        console.log('✅ Read verification successful');
    } else {
        throw new Error('Read verification failed');
    }

    // 3. Clean up
    await client.query('DELETE FROM technical_service_documents WHERE id = $1', [newId]);
    console.log('✅ Cleaned up test record');

    console.log('🎉 Technical Service DB Module Verification PASSED');

  } catch (err) {
    console.error('❌ Test FAILED:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runTest();
