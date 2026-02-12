
import { getPool } from '../lib/neon-clinical-db.js';

async function verifyTable() {
  const pool = getPool();
  if (!pool) {
    console.error('❌ No hay conexión a la base de datos (getPool returned null)');
    return;
  }
  
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'financial_records';
    `);

    if (res.rows.length === 0) {
      console.error('❌ La tabla "financial_records" NO existe.');
    } else {
      console.log('✅ La tabla "financial_records" existe con las siguientes columnas:');
      console.table(res.rows);
    }
  } catch (err) {
    console.error('❌ Error verificando la tabla:', err);
  } finally {
    // No cerramos el pool porque puede ser compartido, pero script termina
    process.exit(0);
  }
}

verifyTable();
