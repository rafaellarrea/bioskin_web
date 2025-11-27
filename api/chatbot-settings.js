import { sql } from '@vercel/postgres';
import { getGlobalSettings, updateGlobalSettings } from '../lib/neon-chatbot-db-vercel.js';

export default async function handler(req, res) {
  // 1. Verify Auth
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  
  try {
    const session = await sql`
      SELECT * FROM admin_sessions 
      WHERE session_token = ${token} 
      AND is_active = true 
      AND expires_at > NOW()
    `;
    
    if (session.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    // Si falla la verificación de sesión por error de DB, permitimos continuar si es GET
    // para no bloquear la UI, pero bloqueamos POST
    if (req.method === 'POST') {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // 2. Handle Request
  try {
    if (req.method === 'GET') {
      const settings = await getGlobalSettings();
      return res.status(200).json(settings);
    } else if (req.method === 'POST') {
      const { chatbotEnabled } = req.body;
      if (typeof chatbotEnabled !== 'boolean') {
        return res.status(400).json({ error: 'Invalid payload' });
      }
      
      await updateGlobalSettings({ chatbotEnabled });
      return res.status(200).json({ success: true, chatbotEnabled });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Settings error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
