import pg from 'pg';
const { Client } = pg;

console.log('🔧 Aplicando migración: agregar columna facial_routine...');

const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ Error: No se encontró la variable NEON_DATABASE_URL o POSTGRES_URL');
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Verificar si la columna ya existe
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'medical_history' 
      AND column_name = 'facial_routine'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('⚠️ La columna facial_routine ya existe. Migración no necesaria.');
      await client.end();
      return;
    }

    // Agregar columna
    await client.query(`
      ALTER TABLE medical_history 
      ADD COLUMN facial_routine TEXT
    `);

    console.log('✅ Columna facial_routine agregada exitosamente');
    
    await client.end();
    console.log('✅ Migración completada');
    
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    await client.end();
    process.exit(1);
  }
}

runMigration();
