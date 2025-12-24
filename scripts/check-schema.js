
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('No connection string found');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'medical_history';
    `);
    console.log('Columns in medical_history:', res.rows);

    const record = await pool.query('SELECT id FROM clinical_records LIMIT 1');
    console.log('Sample Record ID:', record.rows[0]);
  } catch (err) {
    console.error('Error checking schema:', err);
  } finally {
    await pool.end();
  }
}

checkSchema();
