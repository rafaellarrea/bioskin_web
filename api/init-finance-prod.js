
import { getPool } from '../lib/neon-clinical-db.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const pool = getPool();
    if (!pool) throw new Error('No DB connection');

    console.log('🔄 Inicializando tabla financial_records en producción...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS financial_records (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(100),
        date DATE,
        entity VARCHAR(200),
        subtotal NUMERIC(15, 2),
        tax NUMERIC(15, 2),
        total NUMERIC(15, 2),
        description TEXT,
        type VARCHAR(20) CHECK (type IN ('ingreso', 'egreso')),
        registered_by VARCHAR(50) CHECK (registered_by IN ('Rafael', 'Daniela')),
        status VARCHAR(20) DEFAULT 'confirmed',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Verificar si se creó
    const check = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'financial_records';
    `);

    return res.status(200).json({ 
        success: true, 
        message: 'Tabla creada/verificada', 
        columns: check.rows.map(r => r.column_name) 
    });

  } catch (err) {
    console.error('Error init DB:', err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
