
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // Load .env as fallback

import { Pool } from '@neondatabase/serverless';

async function testConnection() {
  // Dynamic import to ensure env vars are loaded first
  const { initClinicalDatabase } = await import('../lib/neon-clinical-db.js');
  
  console.log('Testing Neon DB Connection...');
  console.log('Testing Neon DB Connection...');
  
  const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('❌ No connection string found in environment variables.');
    return;
  }

  console.log('Connection string found (masked):', connectionString.replace(/:[^:@]*@/, ':****@'));

  const pool = new Pool({ connectionString });

  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to Neon DB!');
    
    const res = await client.query('SELECT NOW()');
    console.log('Current DB Time:', res.rows[0].now);
    
    client.release();
    
    console.log('Attempting to initialize clinical database schema...');
    await initClinicalDatabase();
    console.log('✅ Schema initialization check passed.');

    // List all tables in the current database/schema
    console.log('Listing all tables in public schema:');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.table(tables.rows);

    const patients = await pool.query('SELECT * FROM patients');
    console.log(`Found ${patients.rows.length} patients.`);
    
    if (patients.rows.length === 0) {
        console.log('Creating test patient...');
        await pool.query(`
            INSERT INTO patients (first_name, last_name, email, phone, rut)
            VALUES ('Test', 'Patient', 'test@example.com', '+56912345678', '12.345.678-9')
        `);
        console.log('✅ Test patient created.');
    } else {
        console.log('First patient:', patients.rows[0].first_name, patients.rows[0].last_name);
    }

  } catch (err) {
    console.error('❌ Connection failed:', err);
  } finally {
    await pool.end();
  }
}

testConnection();
