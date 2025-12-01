import { sql } from '@vercel/postgres';

async function addPreferencesColumn() {
  try {
    console.log('🔧 Agregando columna preferences a chat_conversations...\n');
    
    // Verificar si la columna ya existe
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'chat_conversations' 
      AND column_name = 'preferences'
    `;
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ La columna preferences ya existe. No se requiere migración.');
      process.exit(0);
    }
    
    // Agregar la columna
    await sql`
      ALTER TABLE chat_conversations 
      ADD COLUMN preferences JSONB DEFAULT '{}'
    `;
    
    console.log('✅ Columna preferences agregada exitosamente!');
    
    // Crear índice GIN para búsquedas eficientes en JSONB
    await sql`
      CREATE INDEX IF NOT EXISTS idx_conversation_preferences 
      ON chat_conversations USING GIN (preferences)
    `;
    
    console.log('✅ Índice idx_conversation_preferences creado!');
    
    // Verificar
    const verify = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'chat_conversations' 
      AND column_name = 'preferences'
    `;
    
    console.log('\n📊 Verificación:');
    console.log(JSON.stringify(verify.rows[0], null, 2));
    
    console.log('\n🎉 ¡Migración completada exitosamente!');
    
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

addPreferencesColumn();
