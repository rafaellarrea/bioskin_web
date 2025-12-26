import { getPool } from '../lib/neon-clinical-db.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

async function updateSchema() {
  const pool = getPool();
  if (!pool) {
    console.error('❌ No se pudo conectar a la base de datos. Verifique sus variables de entorno.');
    process.exit(1);
  }

  try {
    console.log('🏥 Actualizando esquema de Fichas Clínicas...');

    // Create consultation_info table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS consultation_info (
        id SERIAL PRIMARY KEY,
        record_id INTEGER REFERENCES clinical_records(id) ON DELETE CASCADE,
        reason TEXT,
        current_illness TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Add unique constraint to ensure one consultation info per record
    await pool.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'consultation_info_record_id_key'
            ) THEN
                ALTER TABLE consultation_info ADD CONSTRAINT consultation_info_record_id_key UNIQUE (record_id);
            END IF;
        END
        $$;
    `);

    console.log('✅ Tabla consultation_info creada/verificada correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error actualizando esquema:', error);
    process.exit(1);
  }
}

updateSchema();
