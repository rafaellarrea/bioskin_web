import { sql } from '@vercel/postgres';

async function inspectDatabase() {
  try {
    console.log('🔍 Inspeccionando base de datos Neon...\n');
    
    // 1. Listar todas las tablas
    console.log('📋 TABLAS EN LA BASE DE DATOS:');
    console.log('═'.repeat(60));
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    if (tables.rows.length === 0) {
      console.log('❌ No hay tablas en la base de datos\n');
    } else {
      tables.rows.forEach((row, i) => {
        console.log(`${i + 1}. ${row.table_name}`);
      });
      console.log('');
    }
    
    // 2. Para cada tabla, mostrar su estructura
    for (const { table_name } of tables.rows) {
      console.log(`\n📊 ESTRUCTURA DE: ${table_name}`);
      console.log('─'.repeat(60));
      
      const columns = await sql`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = ${table_name}
        ORDER BY ordinal_position
      `;
      
      columns.rows.forEach(col => {
        const type = col.character_maximum_length 
          ? `${col.data_type}(${col.character_maximum_length})`
          : col.data_type;
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  • ${col.column_name.padEnd(20)} ${type.padEnd(20)} ${nullable}${defaultVal}`);
      });
      
      // Contar registros
      const count = await sql.query(`SELECT COUNT(*) as count FROM ${table_name}`);
      console.log(`  ➜ Total registros: ${count.rows[0].count}`);
    }
    
    // 3. Listar índices
    console.log('\n\n🔑 ÍNDICES:');
    console.log('═'.repeat(60));
    const indexes = await sql`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `;
    
    if (indexes.rows.length === 0) {
      console.log('❌ No hay índices definidos\n');
    } else {
      indexes.rows.forEach(idx => {
        console.log(`\n📌 ${idx.indexname}`);
        console.log(`   Tabla: ${idx.tablename}`);
        console.log(`   SQL: ${idx.indexdef.substring(0, 80)}...`);
      });
    }
    
    // 4. Verificar tablas requeridas
    console.log('\n\n✅ VERIFICACIÓN DE TABLAS REQUERIDAS:');
    console.log('═'.repeat(60));
    const requiredTables = [
      'chat_conversations',
      'chat_messages',
      'chatbot_tracking',
      'chatbot_templates',
      'chatbot_app_states'
    ];
    
    const existingTableNames = tables.rows.map(r => r.table_name);
    
    requiredTables.forEach(table => {
      const exists = existingTableNames.includes(table);
      console.log(`${exists ? '✅' : '❌'} ${table}`);
    });
    
    const missing = requiredTables.filter(t => !existingTableNames.includes(t));
    if (missing.length > 0) {
      console.log(`\n⚠️  FALTAN ${missing.length} TABLAS: ${missing.join(', ')}`);
    } else {
      console.log('\n🎉 Todas las tablas requeridas están presentes!');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
  
  process.exit(0);
}

inspectDatabase();
