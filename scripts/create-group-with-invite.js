/**
 * Script para crear grupo de staff WhatsApp y obtener link de invitación
 * Uso: node scripts/create-group-with-invite.js
 */

require('dotenv').config();

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const API_VERSION = 'v21.0';

// Configuración del grupo
const GROUP_CONFIG = {
  messaging_product: 'whatsapp',
  subject: 'BIOSKIN Staff - Notificaciones',
  description: 'Notificaciones automáticas del bot: citas, derivaciones y consultas importantes'
};

// Números de staff para enviar el invite link
const STAFF_NUMBERS = [
  '+593997061321', // Rafael Larrea
  '+593998653732'  // Daniela Creamer
];

/**
 * Crea el grupo de WhatsApp
 */
async function createGroup() {
  console.log('\n🚀 CREANDO GRUPO DE STAFF WHATSAPP\n');
  console.log('━'.repeat(60));
  
  // Validar credenciales
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.error('\n❌ ERROR: Credenciales no configuradas\n');
    console.log('📋 Variables requeridas en .env:');
    console.log('   WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id');
    console.log('   WHATSAPP_ACCESS_TOKEN=tu_access_token\n');
    process.exit(1);
  }

  console.log('✅ Credenciales encontradas');
  console.log(`📱 Phone Number ID: ${PHONE_NUMBER_ID}`);
  console.log(`🔑 Access Token: ${ACCESS_TOKEN.substring(0, 20)}...`);
  console.log('');

  try {
    // Crear grupo
    console.log('📤 Enviando solicitud de creación de grupo...');
    const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/groups`;
    
    console.log(`   Endpoint: ${url}`);
    console.log(`   Subject: "${GROUP_CONFIG.subject}"`);
    console.log('');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(GROUP_CONFIG)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('\n❌ ERROR EN LA API:\n');
      console.error(JSON.stringify(data, null, 2));
      console.error('');
      process.exit(1);
    }

    // Grupo creado
    if (data.id) {
      console.log('\n🎉 ¡GRUPO CREADO EXITOSAMENTE!\n');
      console.log('━'.repeat(60));
      console.log(`📋 Group ID: ${data.id}`);
      console.log('━'.repeat(60));

      // Obtener información del grupo (incluyendo invite link)
      console.log('\n📥 Obteniendo información del grupo...');
      await getGroupInfo(data.id);
      
    } else {
      console.error('\n⚠️ Respuesta inesperada:');
      console.error(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

/**
 * Obtiene información del grupo incluyendo invite link
 */
async function getGroupInfo(groupId) {
  try {
    const url = `https://graph.facebook.com/${API_VERSION}/${groupId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('\n❌ Error obteniendo info del grupo:');
      console.error(JSON.stringify(data, null, 2));
      return;
    }

    console.log('\n✅ Información del grupo obtenida:');
    console.log(JSON.stringify(data, null, 2));

    // Obtener invite link
    if (data.id) {
      await getInviteLink(data.id);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

/**
 * Obtiene el invite link del grupo
 */
async function getInviteLink(groupId) {
  try {
    console.log('\n🔗 Obteniendo invite link...');
    const url = `https://graph.facebook.com/${API_VERSION}/${groupId}?fields=invite_link`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('\n❌ Error obteniendo invite link:');
      console.error(JSON.stringify(data, null, 2));
      return;
    }

    if (data.invite_link) {
      console.log('\n━'.repeat(60));
      console.log('🎉 ¡INVITE LINK GENERADO!');
      console.log('━'.repeat(60));
      console.log(`\n🔗 LINK: ${data.invite_link}\n`);
      console.log('━'.repeat(60));

      // Guardar configuración
      saveConfiguration(groupId, data.invite_link);

      // Mostrar instrucciones
      showInstructions(groupId, data.invite_link);

    } else {
      console.log('\n⚠️ Invite link no disponible aún.');
      console.log('💡 El link se genera automáticamente. Intenta en unos segundos con:');
      console.log(`   node scripts/get-invite-link.js ${groupId}`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

/**
 * Guarda la configuración del grupo
 */
function saveConfiguration(groupId, inviteLink) {
  const fs = require('fs');
  const config = {
    groupId: groupId,
    inviteLink: inviteLink,
    createdAt: new Date().toISOString(),
    staffNumbers: STAFF_NUMBERS,
    status: 'ready_to_invite_staff'
  };

  fs.writeFileSync('.group-config.json', JSON.stringify(config, null, 2));
  console.log('\n💾 Configuración guardada en: .group-config.json');
}

/**
 * Muestra instrucciones de configuración
 */
function showInstructions(groupId, inviteLink) {
  console.log('\n📝 INSTRUCCIONES DE CONFIGURACIÓN\n');
  console.log('━'.repeat(60));
  
  console.log('\n1️⃣ ENVIAR INVITE LINK AL STAFF:');
  console.log('   Copiar y enviar este link a:');
  STAFF_NUMBERS.forEach(num => {
    console.log(`   📱 ${num}: ${inviteLink}`);
  });

  console.log('\n2️⃣ CONFIGURAR EN VERCEL:');
  console.log('   Variable: WHATSAPP_STAFF_GROUP_ID');
  console.log(`   Valor: ${groupId}`);
  console.log('\n   Comando:');
  console.log(`   vercel env add WHATSAPP_STAFF_GROUP_ID`);
  console.log(`   > ${groupId}`);

  console.log('\n3️⃣ CONFIGURAR EN LOCAL (.env):');
  console.log(`   WHATSAPP_STAFF_GROUP_ID=${groupId}`);

  console.log('\n4️⃣ ESPERAR A QUE STAFF SE UNA:');
  console.log('   Rafael y Daniela deben hacer clic en el link');
  console.log('   Una vez unidos, el bot podrá enviar notificaciones');

  console.log('\n━'.repeat(60));
  console.log('✅ ¡PROCESO COMPLETADO!');
  console.log('━'.repeat(60));
}

// Ejecutar
createGroup();
