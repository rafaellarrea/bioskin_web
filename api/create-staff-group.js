/**
 * API endpoint para crear grupo de staff WhatsApp
 * Uso: GET /api/create-staff-group
 * 
 * Este endpoint usa las variables de Vercel directamente:
 * - WHATSAPP_PHONE_NUMBER_ID
 * - WHATSAPP_ACCESS_TOKEN
 */

const API_VERSION = 'v21.0';

const GROUP_CONFIG = {
  messaging_product: 'whatsapp',
  subject: 'BIOSKIN Staff - Notificaciones',
  description: 'Notificaciones automáticas del bot: citas, derivaciones y consultas importantes'
};

const STAFF_NUMBERS = [
  '+593997061321', // Rafael Larrea
  '+593998653732'  // Daniela Creamer
];

export default async function handler(req, res) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

  // Validar credenciales
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    return res.status(500).json({
      error: 'Credenciales no configuradas',
      message: 'WHATSAPP_PHONE_NUMBER_ID y WHATSAPP_ACCESS_TOKEN deben estar en Vercel'
    });
  }

  try {
    console.log('🚀 Creando grupo de staff WhatsApp...');

    // Crear grupo
    const createUrl = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/groups`;
    
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(GROUP_CONFIG)
    });

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      console.error('❌ Error creando grupo:', createData);
      return res.status(createResponse.status).json({
        error: 'Error creando grupo',
        details: createData
      });
    }

    const groupId = createData.id;
    console.log(`✅ Grupo creado: ${groupId}`);

    // Obtener invite link
    const inviteUrl = `https://graph.facebook.com/${API_VERSION}/${groupId}?fields=id,subject,invite_link,created_at`;
    
    const inviteResponse = await fetch(inviteUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });

    const inviteData = await inviteResponse.json();

    if (!inviteResponse.ok) {
      console.error('⚠️ Error obteniendo invite link:', inviteData);
      return res.status(200).json({
        success: true,
        groupId: groupId,
        message: 'Grupo creado pero invite link no disponible aún',
        instructions: 'Ejecutar GET /api/get-invite-link?groupId=' + groupId
      });
    }

    console.log('✅ Invite link obtenido');

    // Respuesta exitosa
    return res.status(200).json({
      success: true,
      groupId: groupId,
      inviteLink: inviteData.invite_link || null,
      subject: inviteData.subject,
      createdAt: inviteData.created_at,
      staffNumbers: STAFF_NUMBERS,
      instructions: {
        step1: 'Enviar invite link a los números de staff',
        step2: 'Configurar WHATSAPP_STAFF_GROUP_ID en Vercel con valor: ' + groupId,
        step3: 'Staff debe hacer clic en el link para unirse'
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}
