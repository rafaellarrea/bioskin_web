import { Pool } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const connectionString = process.env.NEON_DATABASE_URL;
  
  if (!connectionString) {
    return res.status(500).json({ error: 'NEON_DATABASE_URL is missing' });
  }

  const pool = new Pool({ connectionString });

  try {
    // 1. Check connection and current database name
    const dbName = await pool.query('SELECT current_database()');
    
    // 2. List all tables in public schema
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    // 3. Check row count for patients (if table exists)
    let patientCount = 'Table not found';
    let patientSchema = [];
    
    const patientsTable = tables.rows.find(t => t.table_name === 'patients');
    if (patientsTable) {
      const count = await pool.query('SELECT COUNT(*) FROM patients');
      patientCount = count.rows[0].count;
      
      // Get columns
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'patients'
        ORDER BY ordinal_position;
      `);
      patientSchema = columns.rows;
    }

    // 4. Test Write Permission (Transaction Rollback)
    let writeTest = 'Skipped';
    try {
      await pool.query('BEGIN');
      // Try to insert a dummy patient (will be rolled back)
      // Using a random RUT to avoid unique constraint if rollback fails (though it shouldn't)
      const randomRut = `TEST-${Math.floor(Math.random() * 10000)}`;
      await pool.query(`
        INSERT INTO patients (first_name, last_name, rut, email) 
        VALUES ('Test', 'User', $1, 'test@example.com')
      `, [randomRut]);
      await pool.query('ROLLBACK');
      writeTest = 'Success (Insert + Rollback)';
    } catch (writeErr) {
      try { await pool.query('ROLLBACK'); } catch (e) {}
      writeTest = `Failed: ${writeErr.message}`;
    }

    return res.status(200).json({
      status: 'connected',
      database: dbName.rows[0].current_database,
      connectionStringMasked: connectionString.replace(/:[^:]*@/, ':***@'),
      tables: tables.rows.map(t => t.table_name),
      patientCount: patientCount,
      patientSchema: patientSchema,
      writeTest: writeTest
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    });
  } finally {
    await pool.end();
  }
}
