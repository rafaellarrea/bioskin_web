
import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';
dotenv.config();

async function clearChatDatabase() {
  console.log('🧹 Iniciando limpieza de base de datos del chatbot...');

  try {
    // 1. Eliminar mensajes
    console.log('🗑️ Eliminando mensajes...');
    await sql`DELETE FROM chat_messages`;
    console.log('✅ Mensajes eliminados.');

    // 2. Eliminar conversaciones
    console.log('🗑️ Eliminando conversaciones...');
    await sql`DELETE FROM chat_conversations`;
    console.log('✅ Conversaciones eliminadas.');

    // 3. Eliminar tracking
    console.log('🗑️ Eliminando tracking...');
    await sql`DELETE FROM chatbot_tracking`;
    console.log('✅ Tracking eliminado.');

    // 4. Eliminar estados de aplicación (opcional, si se usa para la máquina de estados)
    console.log('🗑️ Eliminando estados de aplicación...');
    await sql`DELETE FROM chatbot_app_states`;
    console.log('✅ Estados de aplicación eliminados.');

    console.log('✨ Limpieza completada exitosamente.');
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
}

clearChatDatabase();
