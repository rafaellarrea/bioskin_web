/**
 * API endpoint para obtener invite link de un grupo existente
 * Uso: GET /api/get-invite-link?groupId=120363XXXXXXXXX@g.us
 * 
 * Este endpoint usa las variables de Vercel directamente:
 * - WHATSAPP_ACCESS_TOKEN
 */

const API_VERSION = 'v21.0';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { groupId } = req.query;
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!groupId) {
    return res.status(400).json({
      error: 'groupId requerido',
      usage: 'GET /api/get-invite-link?groupId=120363XXXXXXXXX@g.us'
    });
  }

  if (!ACCESS_TOKEN) {
    return res.status(500).json({
      error: 'WHATSAPP_ACCESS_TOKEN no configurado en Vercel'
    });
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
      message: data.invite_link ? 'Invite link disponible' : 'Invite link no disponible aún'
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}
