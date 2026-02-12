
import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ No hay cadena de conexión (NEON_DATABASE_URL o POSTGRES_URL)');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function initFinanceDB() {
  try {
    console.log('🔄 Inicializando tabla de registros financieros...');
    
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

    console.log('✅ Tabla financial_records creada/verificada exitosamente.');
  } catch (err) {
    console.error('❌ Error al inicializar DB:', err);
  } finally {
    pool.end();
  }
}

initFinanceDB();
