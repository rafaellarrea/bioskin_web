import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

async function forceUpdateNeon() {
  const connectionString = process.env.NEON_DATABASE_URL;

  if (!connectionString) {
    console.error('❌ Error: NEON_DATABASE_URL no está definida. No se puede actualizar la base de datos Neon específica.');
    console.log('Variables disponibles:', Object.keys(process.env).filter(k => k.includes('DB') || k.includes('URL')));
    process.exit(1);
  }

  if (!connectionString.includes('neon.tech')) {
    console.warn('⚠️ Advertencia: La URL de conexión no parece ser de Neon Tech. Verifique NEON_DATABASE_URL.');
    console.log('Host detectado:', connectionString.split('@')[1]?.split('/')[0]);
  }

  console.log('🔌 Conectando explícitamente a NEON_DATABASE_URL...');
  
  const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false } 
  });

  try {
    console.log('🏥 Verificando/Creando tabla consultation_info en Neon DB...');

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
    
    // Add unique constraint
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

    console.log('✅ Tabla consultation_info actualizada correctamente en NEON_DATABASE_URL.');
    
    // Verificación final
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'consultation_info'");
    if (res.rows.length > 0) {
        console.log('✅ Verificación: La tabla existe en la base de datos.');
    } else {
        console.error('❌ Error: La tabla no se encuentra después de la creación.');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error actualizando esquema en Neon:', error);
    await pool.end();
    process.exit(1);
  }
}

forceUpdateNeon();
