import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('Testing connection...');
  const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;
  
  console.log('Connection String found:', !!connectionString);
  if (connectionString) {
      console.log('Connection String starts with:', connectionString.substring(0, 20) + '...');
  }

  if (!connectionString) {
    console.error('❌ No database connection string found');
    return;
  }

  const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected successfully');
    
    const res = await client.query('SELECT count(*) FROM patients');
    console.log('Patients count:', res.rows[0].count);
    
    client.release();
    await pool.end();
  } catch (err) {
    console.error('❌ Connection failed:', err);
  }
}

testConnection();
