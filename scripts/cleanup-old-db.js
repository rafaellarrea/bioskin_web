import 'dotenv/config';
import { sql } from '@vercel/postgres';
import { Pool } from 'pg';

async function cleanupOldDatabase() {
  console.log('🧹 Limpieza de tablas obsoletas (chat_conversations, chat_messages)...');

  const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
      console.error('❌ No se encontró NEON_DATABASE_URL ni POSTGRES_URL');
      process.exit(1);
  }

  const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    
    // 1. Eliminar chat_messages
    console.log('🗑️ Eliminando chat_messages...');
    await client.query('DROP TABLE IF EXISTS chat_messages CASCADE');
    console.log('✅ chat_messages eliminado.');

    // 2. Eliminar chat_conversations
    console.log('🗑️ Eliminando chat_conversations...');
    await client.query('DROP TABLE IF EXISTS chat_conversations CASCADE');
    console.log('✅ chat_conversations eliminado.');

    client.release();
    console.log('✨ Limpieza completada exitosamente.');
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
      await pool.end();
  }
}

cleanupOldDatabase();