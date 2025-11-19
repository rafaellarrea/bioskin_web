/**
 * API de autenticación para el panel administrativo
 * Usa credenciales de variables de entorno (más seguro)
 */

import { sql } from '@vercel/postgres';
import crypto from 'crypto';

// Tiempo de expiración de sesión: 24 horas
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * Hash de contraseña usando SHA-256
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Genera un token de sesión único
 */
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Inicializa la tabla de sesiones (solo sesiones, no usuarios)
 */
async function initSessionsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id SERIAL PRIMARY KEY,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        ip_address VARCHAR(100),
        user_agent TEXT,
        is_active BOOLEAN DEFAULT true
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_session_token ON admin_sessions(session_token) WHERE is_active = true
    `;

    console.log('✅ Tabla de sesiones inicializada');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando tabla de sesiones:', error);
    return false;
  }
}

/**
 * Valida credenciales contra variables de entorno
 */
function validateCredentials(username, password) {
  const validUsername = process.env.ADMIN_USERNAME || 'admin';
  const validPassword = process.env.ADMIN_PASSWORD || 'b10sk1n';

  return username === validUsername && password === validPassword;
}

/**
 * Login con credenciales de variables de entorno
 */
async function login(username, password, ipAddress = null, userAgent = null) {
  try {
    // Validar credenciales contra variables de entorno
    if (!validateCredentials(username, password)) {
      return {
        success: false,
        error: 'Credenciales inválidas'
      };
    }

    // Asegurar que existe la tabla
    await initSessionsTable();

    // Generar token de sesión
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);

    // Crear sesión
    await sql`
      INSERT INTO admin_sessions (session_token, username, expires_at, ip_address, user_agent)
      VALUES (${sessionToken}, ${username}, ${expiresAt}, ${ipAddress}, ${userAgent})
    `;

    console.log(`✅ Login exitoso: ${username}`);

    return {
      success: true,
      sessionToken,
      expiresAt,
      user: {
        username,
        email: 'admin@bioskin.com'
      }
    };
  } catch (error) {
    console.error('❌ Error en login:', error);
    return {
      success: false,
      error: 'Error al iniciar sesión'
    };
  }
}

/**
 * Verifica si un token de sesión es válido
 */
async function verifySession(sessionToken) {
  try {
    if (!sessionToken) {
      return { valid: false, error: 'Token no proporcionado' };
    }

    const result = await sql`
      SELECT 
        id as session_id,
        username,
        expires_at
      FROM admin_sessions
      WHERE session_token = ${sessionToken}
        AND is_active = true
        AND expires_at > NOW()
    `;

    if (!result.rows || result.rows.length === 0) {
      return { valid: false, error: 'Sesión inválida o expirada' };
    }

    const session = result.rows[0];

    return {
      valid: true,
      user: {
        username: session.username,
        email: 'admin@bioskin.com'
      },
      expiresAt: session.expires_at
    };
  } catch (error) {
    console.error('❌ Error verificando sesión:', error);
    return { valid: false, error: 'Error al verificar sesión' };
  }
}

/**
 * Cierra sesión (logout)
 */
async function logout(sessionToken) {
  try {
    await sql`
      UPDATE admin_sessions
      SET is_active = false
      WHERE session_token = ${sessionToken}
    `;

    console.log('✅ Sesión cerrada');
    return { success: true };
  } catch (error) {
    console.error('❌ Error cerrando sesión:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Limpia sesiones expiradas
 */
async function cleanExpiredSessions() {
  try {
    const result = await sql`
      UPDATE admin_sessions
      SET is_active = false
      WHERE expires_at < NOW() AND is_active = true
    `;

    const count = result.rowCount || 0;
    console.log(`✅ Limpiadas ${count} sesiones expiradas`);
    return { success: true, count };
  } catch (error) {
    console.error('❌ Error limpiando sesiones:', error);
    return { success: false, error: error.message };
  }
}

export default async function handler(req, res) {
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
    // INICIALIZAR TABLA DE SESIONES
    // ============================================
    if (action === 'init') {
      const success = await initSessionsTable();
      return res.status(200).json({
        success,
        message: success ? 'Tabla de sesiones inicializada' : 'Error al inicializar'
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
        return res.status(200).json(result);
      } else {
        return res.status(401).json(result);
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
    // LIMPIAR SESIONES EXPIRADAS
    // ============================================
    if (action === 'cleanup') {
      const result = await cleanExpiredSessions();
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
