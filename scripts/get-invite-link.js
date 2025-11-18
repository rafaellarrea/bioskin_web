/**
 * Script para obtener el invite link de un grupo existente
 * Uso: node scripts/get-invite-link.js [GROUP_ID]
 */

require('dotenv').config();

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const API_VERSION = 'v21.0';

const groupId = process.argv[2];

if (!groupId) {
  console.error('\n❌ ERROR: Group ID no proporcionado\n');
  console.log('Uso: node scripts/get-invite-link.js GROUP_ID');
  console.log('Ejemplo: node scripts/get-invite-link.js 120363XXXXXXXXX@g.us\n');
  process.exit(1);
}

async function getInviteLink() {
  console.log('\n🔗 OBTENIENDO INVITE LINK\n');
  console.log('━'.repeat(60));
  console.log(`📋 Group ID: ${groupId}`);
  console.log('━'.repeat(60));

  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.error('\n❌ ERROR: Credenciales no configuradas\n');
    process.exit(1);
  }

  try {
    const url = `https://graph.facebook.com/${API_VERSION}/${groupId}?fields=id,subject,invite_link,created_at`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('\n❌ Error:');
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log('\n✅ Información del grupo:\n');
    console.log(`   Nombre: ${data.subject || 'N/A'}`);
    console.log(`   ID: ${data.id || 'N/A'}`);
    console.log(`   Creado: ${data.created_at || 'N/A'}`);
    
    if (data.invite_link) {
      console.log('\n━'.repeat(60));
      console.log('🎉 INVITE LINK:');
      console.log('━'.repeat(60));
      console.log(`\n${data.invite_link}\n`);
      console.log('━'.repeat(60));
    } else {
      console.log('\n⚠️ Invite link no disponible');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

getInviteLink();
