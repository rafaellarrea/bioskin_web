/**
 * Sistema de autenticación para el panel administrativo
 * Maneja login, sesiones y verificación de acceso
 */

import { sql } from '@vercel/postgres';
import crypto from 'crypto';

// Tiempo de expiración de sesión: 24 horas
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * Inicializa las tablas de autenticación
 */
export async function initAuthTables() {
  try {
    // Tabla de usuarios admin
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        full_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `;

    // Tabla de sesiones
    await sql`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id SERIAL PRIMARY KEY,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        ip_address VARCHAR(100),
        user_agent TEXT,
        is_active BOOLEAN DEFAULT true,
        FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
      )
    `;

    // Índices para mejor performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_session_token ON admin_sessions(session_token) WHERE is_active = true
    `;

    console.log('✅ Tablas de autenticación inicializadas');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando tablas de auth:', error);
    throw error;
  }
}

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
 * Crea un usuario administrador
 */
export async function createAdminUser(username, password, email = null, fullName = null) {
  try {
    const passwordHash = hashPassword(password);
    
    const result = await sql`
      INSERT INTO admin_users (username, password_hash, email, full_name)
      VALUES (${username}, ${passwordHash}, ${email}, ${fullName})
      RETURNING id, username, email, full_name, created_at
    `;

    if (result.rows && result.rows.length > 0) {
      console.log(`✅ Usuario admin creado: ${username}`);
      return result.rows[0];
    }

    throw new Error('No se pudo crear el usuario');
  } catch (error) {
    if (error.message.includes('duplicate key')) {
      throw new Error('El usuario ya existe');
    }
    console.error('❌ Error creando usuario admin:', error);
    throw error;
  }
}

/**
 * Valida credenciales y crea sesión
 */
export async function login(username, password, ipAddress = null, userAgent = null) {
  try {
    const passwordHash = hashPassword(password);

    // Verificar credenciales
    const userResult = await sql`
      SELECT id, username, email, full_name, is_active
      FROM admin_users
      WHERE username = ${username} AND password_hash = ${passwordHash} AND is_active = true
    `;

    if (!userResult.rows || userResult.rows.length === 0) {
      throw new Error('Credenciales inválidas');
    }

    const user = userResult.rows[0];

    // Generar token de sesión
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);

    // Crear sesión
    await sql`
      INSERT INTO admin_sessions (session_token, user_id, expires_at, ip_address, user_agent)
      VALUES (${sessionToken}, ${user.id}, ${expiresAt}, ${ipAddress}, ${userAgent})
    `;

    // Actualizar último login
    await sql`
      UPDATE admin_users SET last_login = NOW() WHERE id = ${user.id}
    `;

    console.log(`✅ Login exitoso: ${username}`);

    return {
      success: true,
      sessionToken,
      expiresAt,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name
      }
    };
  } catch (error) {
    console.error('❌ Error en login:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verifica si un token de sesión es válido
 */
export async function verifySession(sessionToken) {
  try {
    if (!sessionToken) {
      return { valid: false, error: 'Token no proporcionado' };
    }

    const result = await sql`
      SELECT 
        s.id as session_id,
        s.expires_at,
        s.user_id,
        u.username,
        u.email,
        u.full_name,
        u.is_active
      FROM admin_sessions s
      JOIN admin_users u ON s.user_id = u.id
      WHERE s.session_token = ${sessionToken}
        AND s.is_active = true
        AND s.expires_at > NOW()
        AND u.is_active = true
    `;

    if (!result.rows || result.rows.length === 0) {
      return { valid: false, error: 'Sesión inválida o expirada' };
    }

    const session = result.rows[0];

    return {
      valid: true,
      user: {
        id: session.user_id,
        username: session.username,
        email: session.email,
        fullName: session.full_name
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
export async function logout(sessionToken) {
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
 * Limpia sesiones expiradas (cron job)
 */
export async function cleanExpiredSessions() {
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

/**
 * Obtiene todas las sesiones activas de un usuario
 */
export async function getUserActiveSessions(userId) {
  try {
    const result = await sql`
      SELECT 
        id,
        session_token,
        created_at,
        expires_at,
        ip_address,
        user_agent
      FROM admin_sessions
      WHERE user_id = ${userId}
        AND is_active = true
        AND expires_at > NOW()
      ORDER BY created_at DESC
    `;

    return {
      success: true,
      sessions: result.rows || []
    };
  } catch (error) {
    console.error('❌ Error obteniendo sesiones:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cambia la contraseña de un usuario
 */
export async function changePassword(userId, oldPassword, newPassword) {
  try {
    const oldHash = hashPassword(oldPassword);
    const newHash = hashPassword(newPassword);

    // Verificar contraseña actual
    const verify = await sql`
      SELECT id FROM admin_users
      WHERE id = ${userId} AND password_hash = ${oldHash}
    `;

    if (!verify.rows || verify.rows.length === 0) {
      throw new Error('Contraseña actual incorrecta');
    }

    // Actualizar contraseña
    await sql`
      UPDATE admin_users
      SET password_hash = ${newHash}
      WHERE id = ${userId}
    `;

    // Invalidar todas las sesiones excepto la actual
    await sql`
      UPDATE admin_sessions
      SET is_active = false
      WHERE user_id = ${userId}
    `;

    console.log(`✅ Contraseña cambiada para usuario ID: ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error cambiando contraseña:', error);
    return { success: false, error: error.message };
  }
}
