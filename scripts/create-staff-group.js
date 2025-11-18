/**
 * Script para crear el grupo de staff de BIOSKIN en WhatsApp
 * 
 * Documentación:
 * https://developers.facebook.com/docs/whatsapp/cloud-api/groups/reference#create-group
 * 
 * USO:
 * node scripts/create-staff-group.js
 */

require('dotenv').config();

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

async function createStaffGroup() {
  console.log('\n🚀 ===== CREACIÓN DE GRUPO STAFF BIOSKIN =====\n');

  // Verificar variables de entorno
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.error('❌ ERROR: Faltan variables de entorno');
    console.log('\n📝 Configurar en .env:');
    console.log('   WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id');
    console.log('   WHATSAPP_ACCESS_TOKEN=tu_access_token');
    process.exit(1);
  }

  console.log('✅ Variables de entorno configuradas');
  console.log(`   Phone Number ID: ${phoneNumberId.substring(0, 10)}...`);
  console.log(`   Access Token: ${accessToken.substring(0, 20)}...\n`);

  // Verificar si ya existe un grupo configurado
  const existingGroupId = process.env.WHATSAPP_STAFF_GROUP_ID;
  if (existingGroupId) {
    console.log('⚠️  Ya existe un Group ID configurado:', existingGroupId);
    console.log('\n¿Deseas crear un nuevo grupo de todas formas?');
    console.log('El Group ID anterior quedará inválido.\n');
    
    // En producción, podrías agregar confirmación aquí
    // Por ahora, verificamos el grupo existente primero
    
    try {
      console.log('🔍 Verificando grupo existente...');
      const verifyResponse = await fetch(
        `${WHATSAPP_API_URL}/${existingGroupId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (verifyResponse.ok) {
        const groupData = await verifyResponse.json();
        console.log('✅ Grupo existente encontrado:');
        console.log(`   Nombre: ${groupData.subject}`);
        console.log(`   Creado: ${new Date(groupData.creation_time * 1000).toLocaleString('es-ES')}`);
        console.log(`   Participantes: ${groupData.participants?.length || 'N/A'}`);
        console.log('\n✨ No es necesario crear un nuevo grupo.');
        process.exit(0);
      }
    } catch (error) {
      console.log('⚠️  Grupo existente no accesible, creando uno nuevo...\n');
    }
  }

  // Datos del grupo
  const groupConfig = {
    subject: 'BIOSKIN Staff - Notificaciones',
    participants: [
      '+593997061321', // Ing. Rafael Larrea
      '+593998653732'  // Dra. Daniela Creamer
    ]
  };

  console.log('📋 Configuración del grupo:');
  console.log(`   Nombre: "${groupConfig.subject}"`);
  console.log(`   Participantes:`);
  groupConfig.participants.forEach(p => console.log(`     - ${p}`));
  console.log('');

  try {
    console.log('📤 Creando grupo en WhatsApp...');
    
    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneNumberId}/groups`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(groupConfig)
      }
    );

    const responseText = await response.text();
    console.log('\n📥 Respuesta de la API:');
    console.log(responseText);

    if (!response.ok) {
      const errorData = JSON.parse(responseText);
      console.error('\n❌ Error al crear el grupo:');
      console.error('   Status:', response.status);
      console.error('   Mensaje:', errorData.error?.message || 'Error desconocido');
      
      if (errorData.error?.code === 131047) {
        console.log('\n💡 Posible causa: Rate limit alcanzado');
        console.log('   Solución: Espera unos minutos e intenta de nuevo');
      } else if (errorData.error?.code === 100) {
        console.log('\n💡 Posible causa: Parámetros inválidos');
        console.log('   Verifica el formato de los números (+593...)');
      } else if (errorData.error?.code === 131051) {
        console.log('\n💡 Posible causa: Número no tiene WhatsApp');
        console.log('   Verifica que los números tengan WhatsApp activo');
      }
      
      process.exit(1);
    }

    const data = JSON.parse(responseText);

    if (data.id) {
      console.log('\n🎉 ¡GRUPO CREADO EXITOSAMENTE!\n');
      console.log('📋 Información del grupo:');
      console.log(`   Group ID: ${data.id}`);
      
      if (data.participants) {
        console.log(`   Participantes agregados: ${data.participants.length}`);
        data.participants.forEach(p => {
          console.log(`     - ${p.wa_id || p.phone || 'N/A'}`);
        });
      }

      console.log('\n📝 SIGUIENTE PASO: Configurar en Vercel');
      console.log('   1. Ir a Dashboard Vercel → Settings → Environment Variables');
      console.log('   2. Agregar variable:');
      console.log(`      Name: WHATSAPP_STAFF_GROUP_ID`);
      console.log(`      Value: ${data.id}`);
      console.log('   3. Re-deploy el proyecto');

      console.log('\n📝 Para desarrollo local, agregar a .env:');
      console.log(`WHATSAPP_STAFF_GROUP_ID=${data.id}`);

      // Guardar en archivo temporal
      const fs = require('fs');
      const configFile = '.group-config.json';
      fs.writeFileSync(
        configFile,
        JSON.stringify({
          groupId: data.id,
          createdAt: new Date().toISOString(),
          participants: groupConfig.participants
        }, null, 2)
      );
      console.log(`\n💾 Configuración guardada en: ${configFile}`);

      return data.id;
    } else {
      console.error('\n❌ Respuesta inesperada de la API');
      console.error('   No se recibió un Group ID');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error durante la creación del grupo:');
    console.error('   ', error.message);
    
    if (error.cause) {
      console.error('   Causa:', error.cause);
    }
    
    console.log('\n📖 Documentación:');
    console.log('   https://developers.facebook.com/docs/whatsapp/cloud-api/groups/reference#create-group');
    
    process.exit(1);
  }
}

// Función auxiliar para verificar grupo existente
async function verifyGroup(groupId) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  
  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${groupId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

// Ejecutar
createStaffGroup().catch(error => {
  console.error('\n💥 Error fatal:', error.message);
  process.exit(1);
});
