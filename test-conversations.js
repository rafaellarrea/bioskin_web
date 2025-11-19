import { sql } from '@vercel/postgres';

async function testConversations() {
  try {
    console.log('🔍 Verificando conversaciones en BD...\n');
    
    // Contar total
    const countResult = await sql`SELECT COUNT(*) as count FROM chat_conversations`;
    console.log(`📊 Total conversaciones: ${countResult.rows[0].count}`);
    
    // Mostrar primeras 5
    const conversations = await sql`
      SELECT session_id, phone_number, created_at, last_message_at, total_messages, is_active
      FROM chat_conversations
      ORDER BY last_message_at DESC
      LIMIT 5
    `;
    
    console.log('\n📋 Últimas 5 conversaciones:');
    console.log(JSON.stringify(conversations.rows, null, 2));
    
    // Verificar mensajes
    const messagesCount = await sql`SELECT COUNT(*) as count FROM chat_messages`;
    console.log(`\n💬 Total mensajes: ${messagesCount.rows[0].count}`);
    
    // Mostrar últimos mensajes
    const recentMessages = await sql`
      SELECT m.session_id, c.phone_number, m.role, m.content, m.timestamp
      FROM chat_messages m
      LEFT JOIN chat_conversations c ON m.session_id = c.session_id
      ORDER BY m.timestamp DESC
      LIMIT 5
    `;
    
    console.log('\n💬 Últimos 5 mensajes:');
    recentMessages.rows.forEach(msg => {
      console.log(`- [${msg.phone_number || 'N/A'}] ${msg.role}: ${msg.content.substring(0, 50)}...`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

testConversations();
