/**
 * API de autenticación para el panel administrativo
 * Maneja login, logout y verificación de sesiones
 */

import { 
  initAuthTables,
  login, 
  logout, 
  verifySession,
  createAdminUser,
  changePassword,
  getUserActiveSessions
} from '../lib/admin-auth.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = req.query.action || req.body?.action;

  try {
    // ============================================
    // INICIALIZAR TABLAS (admin only)
    // ============================================
    if (action === 'init') {
      await initAuthTables();
      return res.status(200).json({
        success: true,
        message: 'Tablas de autenticación inicializadas'
      });
    }

    // ============================================
    // CREAR USUARIO (protegido por secret)
    // ============================================
    if (action === 'createUser') {
      const { username, password, email, fullName, secret } = req.body;

      // Verificar secret (debe estar en variables de entorno)
      if (secret !== process.env.ADMIN_SETUP_SECRET) {
        return res.status(403).json({
          success: false,
          error: 'No autorizado'
        });
      }

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Usuario y contraseña son requeridos'
        });
      }

      const user = await createAdminUser(username, password, email, fullName);
      return res.status(201).json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name
        }
      });
    }

    // ============================================
    // LOGIN
    // ============================================
    if (action === 'login') {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Usuario y contraseña son requeridos'
        });
      }

      const ipAddress = req.headers['x-forwarded-for'] || 
                        req.headers['x-real-ip'] || 
                        req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await login(username, password, ipAddress, userAgent);

      if (result.success) {
        return res.status(200).json({
          success: true,
          sessionToken: result.sessionToken,
          expiresAt: result.expiresAt,
          user: result.user
        });
      } else {
        return res.status(401).json({
          success: false,
          error: result.error
        });
      }
    }

    // ============================================
    // VERIFICAR SESIÓN
    // ============================================
    if (action === 'verify') {
      const sessionToken = req.headers.authorization?.replace('Bearer ', '') ||
                           req.query.token ||
                           req.body?.sessionToken;

      const result = await verifySession(sessionToken);

      if (result.valid) {
        return res.status(200).json({
          success: true,
          valid: true,
          user: result.user,
          expiresAt: result.expiresAt
        });
      } else {
        return res.status(401).json({
          success: false,
          valid: false,
          error: result.error
        });
      }
    }

    // ============================================
    // LOGOUT
    // ============================================
    if (action === 'logout') {
      const sessionToken = req.headers.authorization?.replace('Bearer ', '') ||
                           req.body?.sessionToken;

      if (!sessionToken) {
        return res.status(400).json({
          success: false,
          error: 'Token de sesión requerido'
        });
      }

      const result = await logout(sessionToken);

      return res.status(200).json(result);
    }

    // ============================================
    // OBTENER SESIONES ACTIVAS
    // ============================================
    if (action === 'sessions') {
      const sessionToken = req.headers.authorization?.replace('Bearer ', '');
      
      // Verificar sesión actual
      const verification = await verifySession(sessionToken);
      if (!verification.valid) {
        return res.status(401).json({
          success: false,
          error: 'Sesión inválida'
        });
      }

      const result = await getUserActiveSessions(verification.user.id);
      return res.status(200).json(result);
    }

    // ============================================
    // CAMBIAR CONTRASEÑA
    // ============================================
    if (action === 'changePassword') {
      const sessionToken = req.headers.authorization?.replace('Bearer ', '');
      const { oldPassword, newPassword } = req.body;

      // Verificar sesión actual
      const verification = await verifySession(sessionToken);
      if (!verification.valid) {
        return res.status(401).json({
          success: false,
          error: 'Sesión inválida'
        });
      }

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Contraseñas requeridas'
        });
      }

      const result = await changePassword(verification.user.id, oldPassword, newPassword);
      return res.status(200).json(result);
    }

    // Acción no reconocida
    return res.status(400).json({
      success: false,
      error: 'Acción no válida'
    });

  } catch (error) {
    console.error('❌ Error en auth API:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}
