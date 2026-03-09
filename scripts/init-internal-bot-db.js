/**
 * Script de inicialización de la base de datos del chatbot
 * Ejecutar una sola vez después de configurar NEON_DATABASE_URL
 * 
 * Uso:
 *   node scripts/init-chatbot-db.js
 */
import 'dotenv/config';import { initChatbotDatabase, getDatabaseStats } from '../lib/neon-chatbot-db-vercel.js';

import { writeFileSync } from 'fs';

async function initializeDatabase() {
  console.log('🔧 Inicializando base de datos del chatbot...\n');

  try {
    // Verificar variable de entorno
    const dbUrl = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;
    if (!dbUrl) {
      throw new Error('❌ NEON_DATABASE_URL ni POSTGRES_URL están configurados en las variables de entorno');
    }

    console.log('✅ Variable de base de datos encontrada');
    console.log('📡 Conectando a Neon PostgreSQL...\n');

    // Crear tablas
    await initChatbotDatabase();
    
    // Obtener estadísticas
    // const stats = await getDatabaseStats(); // might fail if table access permissions error?

    writeFileSync('db_init_success.txt', 'SUCCESS: Database initialized at ' + new Date().toISOString());
    console.log('✅ Base de datos inicializada correctamente!\n');

  } catch (error) {
    writeFileSync('db_init_error.txt', 'ERROR: ' + error.message + '\n' + error.stack);
    console.error('\n❌ Error inicializando base de datos:', error.message);
    process.exit(1);
  }
}

// Ejecutar inicialización
initializeDatabase();
