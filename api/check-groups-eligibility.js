/**
 * API endpoint para verificar elegibilidad para API de Grupos
 * Uso: GET /api/check-groups-eligibility
 */

const API_VERSION = 'v21.0';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    return res.status(500).json({
      error: 'Credenciales no configuradas'
    });
  }

  try {
    console.log('🔍 Verificando elegibilidad para API de Grupos...');
    console.log(`📱 Phone Number ID: ${PHONE_NUMBER_ID}`);

    // Obtener información del número de teléfono
    const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}?fields=verified_name,code_verification_status,quality_rating,messaging_limit_tier,is_official_business_account,account_mode`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error obteniendo info del número:', data);
      return res.status(response.status).json({
        error: 'Error obteniendo información del número',
        details: data
      });
    }

    console.log('✅ Información obtenida:', data);

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
        required: 'TIER_250 o superior (no TIER_50)'
      },
      is_official_business_account: {
        status: data.is_official_business_account ? '✅ Cumple' : '❌ No cumple',
        value: data.is_official_business_account ? 'Sí' : 'No',
        required: 'Debe ser Official Business Account'
      },
      code_verification_status: {
        status: data.code_verification_status === 'VERIFIED' ? '✅ Cumple' : '⚠️ Revisar',
        value: data.code_verification_status || 'Unknown',
        required: 'VERIFIED requerido'
      }
    };

    // Determinar si es elegible
    const isEligible = 
      data.verified_name &&
      data.quality_rating === 'GREEN' &&
      data.messaging_limit_tier !== 'TIER_50' &&
      data.is_official_business_account &&
      data.code_verification_status === 'VERIFIED';

    return res.status(200).json({
      phoneNumberId: PHONE_NUMBER_ID,
      isEligible: isEligible,
      requirements: requirements,
      fullData: data,
      message: isEligible 
        ? '✅ Tu número CUMPLE los requisitos para API de Grupos'
        : '❌ Tu número NO cumple los requisitos. Ver detalles abajo.',
      documentation: 'https://developers.facebook.com/docs/whatsapp/cloud-api/groups/getting-started'
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}
