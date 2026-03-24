
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

async function checkTables() {
  console.log('🔍 Checking database tables...');
  const client = await pool.connect();
  
  try {
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Tables found in connected DB:');
    res.rows.forEach(row => {
        console.log(` - ${row.table_name}`);
    });

    // Check specific table details
    const tableExists = res.rows.some(r => r.table_name === 'technical_service_documents');
    if (tableExists) {
        console.log('\n✅ "technical_service_documents" table EXISTS.');
        const count = await client.query('SELECT count(*) FROM technical_service_documents');
        console.log(`📊 Row count: ${count.rows[0].count}`);
    } else {
        console.error('\n❌ "technical_service_documents" table DOES NOT EXIST in this database.');
    }

  } catch (err) {
    console.error('❌ Error querying database:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables();
