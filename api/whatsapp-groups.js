/**
 * API UNIFICADA PARA GESTIÓN DE GRUPOS DE WHATSAPP
 * 
 * ENDPOINTS CONSOLIDADOS:
 * - GET /api/whatsapp-groups?action=check - Verificar elegibilidad para API de Grupos
 * - GET /api/whatsapp-groups?action=create - Crear grupo de staff
 * - GET /api/whatsapp-groups?action=invite&groupId=xxx - Obtener invite link de grupo
 * 
 * Reemplaza a:
 * - check-groups-eligibility.js
 * - create-staff-group.js
 * - get-invite-link.js
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
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido. Usa GET' });
  }

  const { action, groupId } = req.query;
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    return res.status(500).json({
      error: 'Credenciales no configuradas',
      hint: 'WHATSAPP_PHONE_NUMBER_ID y WHATSAPP_ACCESS_TOKEN deben estar en Vercel'
    });
  }

  try {
    // ========================================
    // VERIFICAR ELEGIBILIDAD
    // ========================================
    if (action === 'check') {
      console.log('🔍 Verificando elegibilidad para API de Grupos...');
      
      const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}?fields=verified_name,code_verification_status,quality_rating,messaging_limit_tier,is_official_business_account,account_mode`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Error obteniendo info:', data);
        return res.status(response.status).json({
          error: 'Error obteniendo información del número',
          details: data
        });
      }

      // Analizar requisitos
      const requirements = {
        verified_name: {
          status: data.verified_name ? '✅ Cumple' : '❌ No cumple',
          value: data.verified_name || 'No verificado',
          required: 'Nombre verificado requerido'
        },
        quality_rating: {
          status: data.quality_rating === 'GREEN' ? '✅ Cumple' : '⚠️ Revisar',
          value: data.quality_rating || 'Unknown',
          required: 'GREEN (calidad alta) requerido'
        },
        messaging_limit_tier: {
          status: data.messaging_limit_tier && data.messaging_limit_tier !== 'TIER_50' ? '✅ Cumple' : '❌ No cumple',
          value: data.messaging_limit_tier || 'Unknown',
          required: 'TIER_250 o superior'
        },
        is_official_business_account: {
          status: data.is_official_business_account ? '✅ Cumple' : '❌ No cumple',
          value: data.is_official_business_account ? 'Sí' : 'No',
          required: 'Official Business Account'
        },
        code_verification_status: {
          status: data.code_verification_status === 'VERIFIED' ? '✅ Cumple' : '⚠️ Revisar',
          value: data.code_verification_status || 'Unknown',
          required: 'VERIFIED requerido'
        }
      };

      const isEligible = 
        data.verified_name &&
        data.quality_rating === 'GREEN' &&
        data.messaging_limit_tier !== 'TIER_50' &&
        data.is_official_business_account &&
        data.code_verification_status === 'VERIFIED';

      return res.status(200).json({
        success: true,
        phoneNumberId: PHONE_NUMBER_ID,
        isEligible,
        requirements,
        fullData: data,
        message: isEligible 
          ? '✅ Tu número CUMPLE los requisitos para API de Grupos'
          : '❌ Tu número NO cumple los requisitos',
        documentation: 'https://developers.facebook.com/docs/whatsapp/cloud-api/groups/getting-started'
      });
    }

    // ========================================
    // CREAR GRUPO DE STAFF
    // ========================================
    if (action === 'create') {
      console.log('🚀 Creando grupo de staff WhatsApp...');

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

      const newGroupId = createData.id;
      console.log(`✅ Grupo creado: ${newGroupId}`);

      // Obtener invite link
      const inviteUrl = `https://graph.facebook.com/${API_VERSION}/${newGroupId}?fields=id,subject,invite_link,created_at`;
      
      const inviteResponse = await fetch(inviteUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
      });

      const inviteData = await inviteResponse.json();

      if (!inviteResponse.ok) {
        console.warn('⚠️ Error obteniendo invite link:', inviteData);
        return res.status(200).json({
          success: true,
          groupId: newGroupId,
          message: 'Grupo creado pero invite link no disponible aún',
          instructions: `Ejecutar: /api/whatsapp-groups?action=invite&groupId=${newGroupId}`
        });
      }

      return res.status(200).json({
        success: true,
        groupId: newGroupId,
        inviteLink: inviteData.invite_link || null,
        subject: inviteData.subject,
        createdAt: inviteData.created_at,
        staffNumbers: STAFF_NUMBERS,
        instructions: {
          step1: 'Enviar invite link a los números de staff',
          step2: `Configurar WHATSAPP_STAFF_GROUP_ID en Vercel: ${newGroupId}`,
          step3: 'Staff debe hacer clic en el link para unirse'
        }
      });
    }

    // ========================================
    // OBTENER INVITE LINK DE GRUPO EXISTENTE
    // ========================================
    if (action === 'invite') {
      if (!groupId) {
        return res.status(400).json({
          error: 'groupId requerido',
          usage: '/api/whatsapp-groups?action=invite&groupId=120363XXXXXXXXX@g.us'
        });
      }

      console.log(`🔗 Obteniendo invite link para grupo: ${groupId}`);

      const url = `https://graph.facebook.com/${API_VERSION}/${groupId}?fields=id,subject,invite_link,created_at`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Error:', data);
        return res.status(response.status).json({
          error: 'Error obteniendo información del grupo',
          details: data
        });
      }

      return res.status(200).json({
        success: true,
        groupId: data.id,
        subject: data.subject,
        inviteLink: data.invite_link || null,
        createdAt: data.created_at,
        message: data.invite_link ? '✅ Invite link disponible' : '⚠️ Invite link no disponible aún'
      });
    }

    // Acción no válida
    return res.status(400).json({
      error: 'Acción no válida',
      validActions: ['check', 'create', 'invite'],
      examples: {
        check: '/api/whatsapp-groups?action=check',
        create: '/api/whatsapp-groups?action=create',
        invite: '/api/whatsapp-groups?action=invite&groupId=xxx@g.us'
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
