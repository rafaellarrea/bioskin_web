import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

async function verifyPostgresUrl() {
  const neonUrl = process.env.NEON_DATABASE_URL;
  const postgresUrl = process.env.POSTGRES_URL;

  if (!postgresUrl) {
    console.log('✅ POSTGRES_URL no está definida. No hay riesgo de información cruzada.');
    process.exit(0);
  }

  if (neonUrl === postgresUrl) {
    console.log('ℹ️ NEON_DATABASE_URL y POSTGRES_URL son idénticas. Se está usando la misma base de datos.');
    process.exit(0);
  }

  console.log('🔍 Verificando POSTGRES_URL (es diferente a NEON_DATABASE_URL)...');
  
  const pool = new Pool({ 
    connectionString: postgresUrl,
    ssl: { rejectUnauthorized: false } 
  });

  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'consultation_info'");
    
    if (res.rows.length > 0) {
        console.warn('⚠️ ALERTA: La tabla consultation_info EXISTE en la base de datos de POSTGRES_URL.');
        console.warn('   Esto podría indicar información cruzada si se esperaba que estuviera vacía.');
    } else {
        console.log('✅ Verificación exitosa: La tabla consultation_info NO existe en POSTGRES_URL.');
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error conectando a POSTGRES_URL:', error.message);
    // No fallamos el proceso si no podemos conectar, solo informamos
  }
}

verifyPostgresUrl();
