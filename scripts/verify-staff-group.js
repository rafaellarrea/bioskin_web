/**
 * Script para verificar información del grupo de staff
 * 
 * USO:
 * node scripts/verify-staff-group.js [group-id]
 * 
 * Si no se proporciona group-id, usa WHATSAPP_STAFF_GROUP_ID del .env
 */

require('dotenv').config();

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

async function verifyStaffGroup(groupId) {
  console.log('\n🔍 ===== VERIFICACIÓN DE GRUPO STAFF =====\n');

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('❌ ERROR: WHATSAPP_ACCESS_TOKEN no configurado');
    process.exit(1);
  }

  if (!groupId) {
    groupId = process.env.WHATSAPP_STAFF_GROUP_ID;
    if (!groupId) {
      console.error('❌ ERROR: No se proporcionó Group ID');
      console.log('\nUso: node scripts/verify-staff-group.js [group-id]');
      console.log('O configurar WHATSAPP_STAFF_GROUP_ID en .env');
      process.exit(1);
    }
  }

  console.log(`📋 Group ID: ${groupId}`);
  console.log(`🔑 Access Token: ${accessToken.substring(0, 20)}...`);
  console.log('');

  try {
    console.log('📤 Consultando información del grupo...');
    
    const response = await fetch(
      `${WHATSAPP_API_URL}/${groupId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('\n❌ Error al verificar el grupo:');
      console.error('   Status:', response.status);
      console.error('   Mensaje:', errorData.error?.message || 'Error desconocido');
      
      if (response.status === 404) {
        console.log('\n💡 El grupo no existe o fue eliminado');
        console.log('   Ejecutar: node scripts/create-staff-group.js');
      } else if (response.status === 401) {
        console.log('\n💡 Token de acceso inválido o expirado');
        console.log('   Verificar WHATSAPP_ACCESS_TOKEN en .env');
      }
      
      process.exit(1);
    }

    const data = await response.json();

    console.log('\n✅ GRUPO ENCONTRADO\n');
    console.log('📋 Información:');
    console.log(`   ID: ${data.id}`);
    console.log(`   Nombre: ${data.subject || 'N/A'}`);
    
    if (data.creation_time) {
      const createdDate = new Date(data.creation_time * 1000);
      console.log(`   Creado: ${createdDate.toLocaleString('es-ES', { 
        timeZone: 'America/Guayaquil',
        dateStyle: 'full',
        timeStyle: 'short'
      })}`);
    }

    if (data.participants && data.participants.length > 0) {
      console.log(`\n👥 Participantes (${data.participants.length}):`);
      data.participants.forEach((participant, index) => {
        console.log(`   ${index + 1}. ${participant.wa_id || participant.phone || 'N/A'}`);
      });
    } else {
      console.log('\n⚠️  No se pudo obtener la lista de participantes');
      console.log('   Nota: Algunos campos pueden no estar disponibles en la API');
    }

    console.log('\n📊 Estado del sistema:');
    
    const expectedParticipants = ['+593997061321', '+593998653732'];
    console.log(`   Participantes esperados: ${expectedParticipants.length}`);
    
    if (data.participants) {
      const actualCount = data.participants.length;
      if (actualCount === expectedParticipants.length) {
        console.log(`   ✅ Todos los participantes están en el grupo`);
      } else {
        console.log(`   ⚠️  Diferencia detectada: ${actualCount} participantes encontrados`);
      }
    }

    console.log('\n✅ Verificación completada exitosamente');
    console.log('\n📝 El grupo está listo para recibir notificaciones\n');

  } catch (error) {
    console.error('\n❌ Error durante la verificación:');
    console.error('   ', error.message);
    process.exit(1);
  }
}

// Ejecutar
const groupId = process.argv[2];
verifyStaffGroup(groupId).catch(error => {
  console.error('\n💥 Error fatal:', error.message);
  process.exit(1);
});
