/**
 * API de autenticación multi-tenant
 * Roles: master_admin (clinic_id=NULL) > clinic_admin > clinic_user
 * Hash: PBKDF2+salt via Node crypto (sin deps nuevas)
 * Rate limit: 5 intentos → bloqueo 15 min via failed_attempts/locked_until
 */

import { sql } from '@vercel/postgres';
import crypto from 'crypto';

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;
const LOCK_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

// Módulos disponibles en el sistema (ponytail: array plano → upgrade a tabla si crece a >20)
const ALL_FEATURES = [
  'calendar', 'block_schedule', 'appointment', 'diagnosis', 'protocols',
  'chat_assistant', 'clinical_records', 'finance', 'inventory',
  'clinical_3d', 'technical', 'backup', 'blog'
];

// ponytail: PBKDF2+salt (100k iters, sha512) → upgrade a Argon2 si compliance crece. Node built-in, cero deps.
function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const h = crypto.pbkdf2Sync(password, s, 100_000, 64, 'sha512').toString('hex');
  return { hash: h, salt: s };
}

function verifyPassword(password, storedHash, salt, algo) {
  if (algo === 'sha256') {
    // Migración de legado SHA-256 sin salt
    return crypto.createHash('sha256').update(password).digest('hex') === storedHash;
  }
  return hashPassword(password, salt).hash === storedHash;
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ── Schema + seeds ───────────────────────────────────────────────────────────

async function initMultiTenantSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS clinics (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS clinic_users (
      id SERIAL PRIMARY KEY,
      clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      salt VARCHAR(64),
      hash_algo VARCHAR(20) DEFAULT 'pbkdf2',
      full_name VARCHAR(255),
      email VARCHAR(255),
      role VARCHAR(30) NOT NULL DEFAULT 'clinic_user',
      access_scope VARCHAR(20) DEFAULT 'own',
      failed_attempts INTEGER DEFAULT 0,
      locked_until TIMESTAMP,
      is_active BOOLEAN DEFAULT true,
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Extend admin_sessions with new columns (safe on existing tables)
  await sql`ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS clinic_user_id INTEGER`;
  await sql`ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS role VARCHAR(30)`;
  await sql`ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS clinic_id INTEGER`;
  await sql`ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS access_scope VARCHAR(20)`;

  // Extend patients with tenant columns
  await sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinic_id INTEGER REFERENCES clinics(id) ON DELETE SET NULL`;
  await sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS created_by_user_id INTEGER REFERENCES clinic_users(id) ON DELETE SET NULL`;

  await sql`CREATE INDEX IF NOT EXISTS idx_clinic_users_username ON clinic_users(username) WHERE is_active = true`;
  await sql`CREATE INDEX IF NOT EXISTS idx_patients_clinic ON patients(clinic_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_session_token ON admin_sessions(session_token) WHERE is_active = true`;

  // Tabla de features por clínica
  await sql`
    CREATE TABLE IF NOT EXISTS clinic_features (
      clinic_id INTEGER NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
      feature   VARCHAR(50) NOT NULL,
      enabled   BOOLEAN DEFAULT true,
      PRIMARY KEY (clinic_id, feature)
    )
  `;
}

async function seedData() {
  // Seed clínica bioskin
  const existing = await sql`SELECT id FROM clinics WHERE slug = 'bioskin'`;
  let bioskinId;
  if (existing.rows.length === 0) {
    const r = await sql`
      INSERT INTO clinics (name, slug, email, phone, address)
      VALUES ('BIOSKIN', 'bioskin', 'info@bioskin.com', '', '')
      RETURNING id
    `;
    bioskinId = r.rows[0].id;
  } else {
    bioskinId = existing.rows[0].id;
  }

  // Seed master_admin desde env vars (credenciales nunca en código)
  const mu = (process.env.MASTER_ADMIN_USERNAME || '').trim();
  const mp = (process.env.MASTER_ADMIN_PASSWORD || '').trim();
  if (mu && mp) {
    const exM = await sql`SELECT id FROM clinic_users WHERE username = ${mu}`;
    if (exM.rows.length === 0) {
      const { hash, salt } = hashPassword(mp);
      await sql`
        INSERT INTO clinic_users (clinic_id, username, password_hash, salt, hash_algo, full_name, role, access_scope)
        VALUES (NULL, ${mu}, ${hash}, ${salt}, 'pbkdf2', 'Master Admin', 'master_admin', 'all')
      `;
      console.log(`✅ master_admin creado: ${mu}`);
    }
  }

  // Seed clinic_admin de bioskin desde env vars actuales
  const au = (process.env.ADMIN_USERNAME || 'admin').trim();
  const ap = (process.env.ADMIN_PASSWORD || 'b10sk1n').trim();
  const exA = await sql`SELECT id FROM clinic_users WHERE username = ${au}`;
  if (exA.rows.length === 0) {
    const { hash, salt } = hashPassword(ap);
    await sql`
      INSERT INTO clinic_users (clinic_id, username, password_hash, salt, hash_algo, full_name, role, access_scope)
      VALUES (${bioskinId}, ${au}, ${hash}, ${salt}, 'pbkdf2', 'BIOSKIN Admin', 'clinic_admin', 'all')
    `;
    console.log(`✅ clinic_admin bioskin creado: ${au}`);
  }

  // Migrar pacientes existentes sin clínica → bioskin
  await sql`UPDATE patients SET clinic_id = ${bioskinId} WHERE clinic_id IS NULL`;
  console.log(`✅ Pacientes existentes migrados a clínica bioskin (id=${bioskinId})`);

  // Seed features para clínica bioskin
  await seedFeatures(bioskinId);

  return { bioskinId };
}

async function seedFeatures(clinicId) {
  for (const f of ALL_FEATURES) {
    await sql`
      INSERT INTO clinic_features (clinic_id, feature, enabled)
      VALUES (${clinicId}, ${f}, true)
      ON CONFLICT (clinic_id, feature) DO NOTHING
    `;
  }
}

// Devuelve array de features habilitados para una clínica.
// master_admin (clinicId=null) → todos los features.
async function getFeatures(clinicId) {
  if (!clinicId) return ALL_FEATURES;
  try {
    const r = await sql`
      SELECT feature FROM clinic_features
      WHERE clinic_id = ${clinicId} AND enabled = true
    `;
    return r.rows.length ? r.rows.map(x => x.feature) : ALL_FEATURES; // fallback si sin seed
  } catch { return ALL_FEATURES; }
}

async function setFeature(clinicId, feature, enabled) {
  if (!clinicId || !feature) return { error: 'clinicId y feature requeridos' };
  if (!ALL_FEATURES.includes(feature)) return { error: `Feature desconocida: ${feature}` };
  await sql`
    INSERT INTO clinic_features (clinic_id, feature, enabled)
    VALUES (${clinicId}, ${feature}, ${!!enabled})
    ON CONFLICT (clinic_id, feature) DO UPDATE SET enabled = ${!!enabled}
  `;
  return { success: true };
}

async function getAllClinicFeatures() {
  const r = await sql`
    SELECT cf.clinic_id, cf.feature, cf.enabled, c.name as clinic_name
    FROM clinic_features cf
    JOIN clinics c ON c.id = cf.clinic_id
    ORDER BY c.name, cf.feature
  `;
  return r.rows;
}

// ── Auth core ────────────────────────────────────────────────────────────────

async function loginUser(username, password, ip, ua) {
  // Detectar si multi-tenant está inicializado
  let count = 0;
  try {
    const r = await sql`SELECT COUNT(*) as cnt FROM clinic_users`;
    count = parseInt(r.rows[0].cnt);
  } catch { /* tabla no existe aún */ }

  if (count === 0) {
    // Fallback env-var (pre-migración, backwards compat)
    const validU = (process.env.ADMIN_USERNAME || 'admin').trim();
    const validP = (process.env.ADMIN_PASSWORD || 'b10sk1n').trim();
    if (username !== validU || password !== validP) {
      return { success: false, error: 'Credenciales inválidas' };
    }
    await ensureSessionsTable();
    const token = generateToken();
    const exp = new Date(Date.now() + SESSION_EXPIRY_MS);
    await sql`
      INSERT INTO admin_sessions (session_token, username, expires_at, ip_address, user_agent, role, access_scope)
      VALUES (${token}, ${username}, ${exp}, ${ip}, ${ua}, 'clinic_admin', 'all')
    `;
    return { success: true, sessionToken: token, expiresAt: exp, user: { username, role: 'clinic_admin', clinic_id: null, access_scope: 'all', full_name: 'Administrador' } };
  }

  // Login contra DB
  const r = await sql`
    SELECT id, username, password_hash, salt, hash_algo, role, clinic_id, access_scope,
           failed_attempts, locked_until, is_active, full_name, email
    FROM clinic_users WHERE username = ${username}
  `;
  if (!r.rows.length) return { success: false, error: 'Credenciales inválidas' };
  const u = r.rows[0];

  if (!u.is_active) return { success: false, error: 'Cuenta desactivada. Contacta al administrador.' };

  if (u.locked_until && new Date(u.locked_until) > new Date()) {
    const min = Math.ceil((new Date(u.locked_until) - Date.now()) / 60000);
    return { success: false, error: `Cuenta bloqueada. Intenta en ${min} minuto(s).` };
  }

  if (!verifyPassword(password, u.password_hash, u.salt, u.hash_algo)) {
    const attempts = (u.failed_attempts || 0) + 1;
    if (attempts >= LOCK_ATTEMPTS) {
      const lockUntil = new Date(Date.now() + LOCK_MS);
      await sql`UPDATE clinic_users SET failed_attempts = ${attempts}, locked_until = ${lockUntil} WHERE id = ${u.id}`;
      return { success: false, error: 'Demasiados intentos fallidos. Cuenta bloqueada 15 minutos.' };
    }
    await sql`UPDATE clinic_users SET failed_attempts = ${attempts} WHERE id = ${u.id}`;
    return { success: false, error: `Credenciales inválidas. Intentos restantes: ${LOCK_ATTEMPTS - attempts}` };
  }

  // Éxito: reset intentos
  await sql`UPDATE clinic_users SET failed_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ${u.id}`;

  const token = generateToken();
  const exp = new Date(Date.now() + SESSION_EXPIRY_MS);
  await sql`
    INSERT INTO admin_sessions (session_token, username, expires_at, ip_address, user_agent, clinic_user_id, role, clinic_id, access_scope)
    VALUES (${token}, ${username}, ${exp}, ${ip}, ${ua}, ${u.id}, ${u.role}, ${u.clinic_id}, ${u.access_scope})
  `;

  return {
    success: true,
    sessionToken: token,
    expiresAt: exp,
    user: { id: u.id, username: u.username, full_name: u.full_name, email: u.email, role: u.role, clinic_id: u.clinic_id, access_scope: u.access_scope },
    features: await getFeatures(u.clinic_id)
  };
}

async function verifySession(token) {
  if (!token) return { valid: false, error: 'Token no proporcionado' };
  try {
    const r = await sql`
      SELECT s.username, s.expires_at, s.role, s.clinic_id, s.access_scope, s.clinic_user_id
      FROM admin_sessions s
      LEFT JOIN clinic_users cu ON cu.id = s.clinic_user_id
      WHERE s.session_token = ${token}
        AND s.is_active = true
        AND s.expires_at > NOW()
        AND (s.clinic_user_id IS NULL OR cu.is_active = true)
    `;
    if (!r.rows.length) return { valid: false, error: 'Sesión inválida o expirada' };
    const s = r.rows[0];
    return {
      valid: true,
      user: { id: s.clinic_user_id, username: s.username, role: s.role || 'clinic_admin', clinic_id: s.clinic_id, access_scope: s.access_scope || 'all' },
      expiresAt: s.expires_at
    };
  } catch {
    // Fallback para sesiones pre-migración (columnas nuevas no existen aún)
    try {
      const r = await sql`
        SELECT username, expires_at FROM admin_sessions
        WHERE session_token = ${token} AND is_active = true AND expires_at > NOW()
      `;
      if (!r.rows.length) return { valid: false, error: 'Sesión inválida o expirada' };
      return { valid: true, user: { username: r.rows[0].username, role: 'clinic_admin', clinic_id: null, access_scope: 'all' }, expiresAt: r.rows[0].expires_at };
    } catch {
      return { valid: false, error: 'Error al verificar sesión' };
    }
  }
}

async function getRequestUser(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim() || req.body?.sessionToken;
  if (!token) return null;
  const r = await verifySession(token);
  return r.valid ? r.user : null;
}

function requireRole(user, ...roles) {
  return user && roles.includes(user.role);
}

// ── User management ──────────────────────────────────────────────────────────

async function listUsers(requestUser, clinicIdFilter) {
  if (requestUser.role === 'master_admin') {
    if (clinicIdFilter) {
      return (await sql`
        SELECT cu.id, cu.username, cu.full_name, cu.email, cu.role, cu.access_scope,
               cu.is_active, cu.last_login, cu.clinic_id, c.name as clinic_name
        FROM clinic_users cu LEFT JOIN clinics c ON cu.clinic_id = c.id
        WHERE cu.clinic_id = ${clinicIdFilter}
        ORDER BY cu.role, cu.username
      `).rows;
    }
    return (await sql`
      SELECT cu.id, cu.username, cu.full_name, cu.email, cu.role, cu.access_scope,
             cu.is_active, cu.last_login, cu.clinic_id, c.name as clinic_name
      FROM clinic_users cu LEFT JOIN clinics c ON cu.clinic_id = c.id
      ORDER BY c.name NULLS LAST, cu.role, cu.username
    `).rows;
  }
  // clinic_admin: solo su clínica
  return (await sql`
    SELECT id, username, full_name, email, role, access_scope, is_active, last_login, clinic_id
    FROM clinic_users WHERE clinic_id = ${requestUser.clinic_id}
    ORDER BY role, username
  `).rows;
}

async function createUser(requestUser, body) {
  const { username, password, full_name, email, role, access_scope, clinic_id } = body;
  if (!username?.trim() || !password?.trim() || !role) return { error: 'username, password y role son requeridos' };
  if (password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres' };

  if (requestUser.role === 'clinic_admin' && !['clinic_admin', 'clinic_user'].includes(role)) {
    return { error: 'Solo puedes crear usuarios de tipo clinic_admin o clinic_user' };
  }

  const targetClinicId = requestUser.role === 'master_admin'
    ? (role === 'master_admin' ? null : (clinic_id ?? null))
    : requestUser.clinic_id;

  const { hash, salt } = hashPassword(password);
  try {
    const r = await sql`
      INSERT INTO clinic_users (clinic_id, username, password_hash, salt, hash_algo, full_name, email, role, access_scope)
      VALUES (${targetClinicId}, ${username.trim()}, ${hash}, ${salt}, 'pbkdf2', ${full_name || null}, ${email || null}, ${role}, ${access_scope || 'own'})
      RETURNING id, username, full_name, email, role, access_scope, clinic_id, is_active
    `;
    return { success: true, user: r.rows[0] };
  } catch (e) {
    if (e.message?.includes('unique') || e.message?.includes('duplicate')) return { error: 'El nombre de usuario ya existe' };
    throw e;
  }
}

async function updateUser(requestUser, body) {
  const { id, full_name, email, role, access_scope, is_active } = body;
  if (!id) return { error: 'id requerido' };

  if (requestUser.role === 'clinic_admin') {
    const t = await sql`SELECT clinic_id, role FROM clinic_users WHERE id = ${id}`;
    if (!t.rows.length || t.rows[0].clinic_id !== requestUser.clinic_id) return { error: 'Sin permiso' };
    if (t.rows[0].role === 'master_admin') return { error: 'Sin permiso' };
  } else if (requestUser.role !== 'master_admin') {
    return { error: 'Sin permiso' };
  }

  // Actualizar campos comunes con COALESCE (null = mantener valor actual)
  await sql`
    UPDATE clinic_users SET
      full_name   = COALESCE(${full_name   ?? null}, full_name),
      email       = COALESCE(${email       ?? null}, email),
      access_scope= COALESCE(${access_scope?? null}, access_scope),
      is_active   = COALESCE(${is_active   ?? null}, is_active)
    WHERE id = ${id}
  `;
  // Solo master_admin puede cambiar role
  if (requestUser.role === 'master_admin' && role != null) {
    await sql`UPDATE clinic_users SET role = ${role} WHERE id = ${id}`;
  }

  const updated = await sql`
    SELECT id, username, full_name, email, role, access_scope, is_active, clinic_id
    FROM clinic_users WHERE id = ${id}
  `;
  return { success: true, user: updated.rows[0] };
}

async function resetPassword(requestUser, body) {
  const { id, newPassword } = body;
  if (!id || !newPassword) return { error: 'id y newPassword requeridos' };
  if (newPassword.length < 6) return { error: 'Mínimo 6 caracteres' };

  if (requestUser.role === 'clinic_admin') {
    const t = await sql`SELECT clinic_id FROM clinic_users WHERE id = ${id}`;
    if (!t.rows.length || t.rows[0].clinic_id !== requestUser.clinic_id) return { error: 'Sin permiso' };
  } else if (requestUser.role !== 'master_admin') {
    return { error: 'Sin permiso' };
  }

  const { hash, salt } = hashPassword(newPassword);
  await sql`
    UPDATE clinic_users SET password_hash = ${hash}, salt = ${salt}, hash_algo = 'pbkdf2',
           failed_attempts = 0, locked_until = NULL
    WHERE id = ${id}
  `;
  return { success: true };
}

async function deleteUser(requestUser, userId) {
  if (!userId) return { error: 'id requerido' };
  if (requestUser.role === 'clinic_admin') {
    const t = await sql`SELECT clinic_id, role FROM clinic_users WHERE id = ${userId}`;
    if (!t.rows.length || t.rows[0].clinic_id !== requestUser.clinic_id) return { error: 'Sin permiso' };
    if (t.rows[0].role === 'master_admin') return { error: 'Sin permiso' };
  } else if (requestUser.role !== 'master_admin') {
    return { error: 'Sin permiso' };
  }
  await sql`UPDATE clinic_users SET is_active = false WHERE id = ${userId}`;
  await sql`UPDATE admin_sessions SET is_active = false WHERE clinic_user_id = ${userId}`;
  return { success: true };
}

// ── Clinic management (solo master_admin) ────────────────────────────────────

async function listClinics() {
  return (await sql`
    SELECT c.*,
           COUNT(DISTINCT cu.id) FILTER (WHERE cu.is_active = true)::int as user_count,
           COUNT(DISTINCT p.id)::int as patient_count
    FROM clinics c
    LEFT JOIN clinic_users cu ON cu.clinic_id = c.id
    LEFT JOIN patients p ON p.clinic_id = c.id
    GROUP BY c.id ORDER BY c.name
  `).rows;
}

async function createClinic(body) {
  const { name, slug, email, phone, address } = body;
  if (!name?.trim() || !slug?.trim()) return { error: 'name y slug son requeridos' };
  try {
    const r = await sql`
      INSERT INTO clinics (name, slug, email, phone, address)
      VALUES (${name.trim()}, ${slug.trim().toLowerCase()}, ${email || null}, ${phone || null}, ${address || null})
      RETURNING *
    `;
    return { success: true, clinic: r.rows[0] };
  } catch (e) {
    if (e.message?.includes('unique') || e.message?.includes('duplicate')) return { error: 'Ya existe una clínica con ese slug' };
    throw e;
  }
}

async function updateClinic(body) {
  const { id, name, email, phone, address, is_active } = body;
  if (!id) return { error: 'id requerido' };
  await sql`
    UPDATE clinics SET
      name      = COALESCE(${name      ?? null}, name),
      email     = COALESCE(${email     ?? null}, email),
      phone     = COALESCE(${phone     ?? null}, phone),
      address   = COALESCE(${address   ?? null}, address),
      is_active = COALESCE(${is_active ?? null}, is_active)
    WHERE id = ${id}
  `;
  const r = await sql`SELECT * FROM clinics WHERE id = ${id}`;
  return { success: true, clinic: r.rows[0] };
}

// ── Tabla de sesiones (init mínimo, backwards-compat) ────────────────────────

async function ensureSessionsTable() {
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
        is_active BOOLEAN DEFAULT true,
        clinic_user_id INTEGER,
        role VARCHAR(30),
        clinic_id INTEGER,
        access_scope VARCHAR(20)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_session_token ON admin_sessions(session_token) WHERE is_active = true`;
    // Agregar columnas nuevas si tabla ya existía sin ellas
    await sql`ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS clinic_user_id INTEGER`;
    await sql`ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS role VARCHAR(30)`;
    await sql`ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS clinic_id INTEGER`;
    await sql`ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS access_scope VARCHAR(20)`;
  } catch (e) {
    console.error('ensureSessionsTable:', e.message);
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-setup-secret');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action || req.body?.action;

  try {
    // ── initMultiTenant: protegido por ADMIN_SETUP_SECRET ──────────────────
    if (action === 'initMultiTenant') {
      const secret = req.headers['x-setup-secret'] || req.query.secret;
      if (!process.env.ADMIN_SETUP_SECRET || secret !== process.env.ADMIN_SETUP_SECRET) {
        return res.status(403).json({ error: 'Unauthorized — requiere x-setup-secret válido' });
      }
      await initMultiTenantSchema();
      const { bioskinId } = await seedData();
      return res.status(200).json({ success: true, message: 'Multi-tenant inicializado correctamente', bioskinId });
    }

    // ── init (legacy) ──────────────────────────────────────────────────────
    if (action === 'init') {
      await ensureSessionsTable();
      return res.status(200).json({ success: true, message: 'Tabla de sesiones inicializada' });
    }

    // ── login ──────────────────────────────────────────────────────────────
    if (action === 'login') {
      const { username, password } = req.body || {};
      if (!username?.trim() || !password?.trim()) {
        return res.status(400).json({ success: false, error: 'Usuario y contraseña son requeridos' });
      }
      const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '';
      const ua = req.headers['user-agent'] || '';
      const result = await loginUser(username.trim(), password.trim(), ip, ua);
      return res.status(result.success ? 200 : 401).json(result);
    }

    // ── verify ─────────────────────────────────────────────────────────────
    if (action === 'verify') {
      const token = (req.headers.authorization || '').replace('Bearer ', '').trim() || req.query.token || req.body?.sessionToken;
      const result = await verifySession(token);
      if (result.valid) result.features = await getFeatures(result.user.clinic_id);
      return res.status(result.valid ? 200 : 401).json({ success: result.valid, ...result });
    }

    // ── logout ─────────────────────────────────────────────────────────────
    if (action === 'logout') {
      const token = (req.headers.authorization || '').replace('Bearer ', '').trim() || req.body?.sessionToken;
      if (token) await sql`UPDATE admin_sessions SET is_active = false WHERE session_token = ${token}`;
      return res.status(200).json({ success: true });
    }

    // ── cleanup ────────────────────────────────────────────────────────────
    if (action === 'cleanup') {
      const r = await sql`UPDATE admin_sessions SET is_active = false WHERE expires_at < NOW() AND is_active = true`;
      return res.status(200).json({ success: true, count: r.rowCount });
    }

    // ── Acciones autenticadas ──────────────────────────────────────────────
    const user = await getRequestUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'No autenticado o sesión expirada' });

    if (action === 'listUsers') {
      if (!requireRole(user, 'master_admin', 'clinic_admin')) return res.status(403).json({ error: 'Sin permiso' });
      const clinicIdFilter = req.query.clinicId ? parseInt(req.query.clinicId) : null;
      return res.status(200).json(await listUsers(user, clinicIdFilter));
    }

    if (action === 'createUser') {
      if (!requireRole(user, 'master_admin', 'clinic_admin')) return res.status(403).json({ error: 'Sin permiso' });
      const result = await createUser(user, req.body || {});
      return res.status(result.error ? 400 : 201).json(result);
    }

    if (action === 'updateUser') {
      if (!requireRole(user, 'master_admin', 'clinic_admin')) return res.status(403).json({ error: 'Sin permiso' });
      const result = await updateUser(user, req.body || {});
      return res.status(result.error ? 400 : 200).json(result);
    }

    if (action === 'resetPassword') {
      if (!requireRole(user, 'master_admin', 'clinic_admin')) return res.status(403).json({ error: 'Sin permiso' });
      const result = await resetPassword(user, req.body || {});
      return res.status(result.error ? 400 : 200).json(result);
    }

    if (action === 'deleteUser') {
      if (!requireRole(user, 'master_admin', 'clinic_admin')) return res.status(403).json({ error: 'Sin permiso' });
      const userId = req.query.id || req.body?.id;
      const result = await deleteUser(user, userId);
      return res.status(result.error ? 400 : 200).json(result);
    }

    if (action === 'listClinics') {
      if (!requireRole(user, 'master_admin')) return res.status(403).json({ error: 'Solo master_admin' });
      return res.status(200).json(await listClinics());
    }

    if (action === 'createClinic') {
      if (!requireRole(user, 'master_admin')) return res.status(403).json({ error: 'Solo master_admin' });
      const result = await createClinic(req.body || {});
      return res.status(result.error ? 400 : 201).json(result);
    }

    if (action === 'updateClinic') {
      if (!requireRole(user, 'master_admin')) return res.status(403).json({ error: 'Solo master_admin' });
      const result = await updateClinic(req.body || {});
      return res.status(result.error ? 400 : 200).json(result);
    }

    // ── Feature management ───────────────────────────────────────────────
    if (action === 'getFeatures') {
      // clinic_admin/user obtienen sus propias features; master_admin puede consultar cualquier clínica
      const clinicId = req.query.clinicId ? parseInt(req.query.clinicId) : (user.clinic_id || null);
      if (user.role !== 'master_admin' && clinicId !== user.clinic_id) {
        return res.status(403).json({ error: 'Sin permiso' });
      }
      return res.status(200).json({ success: true, features: await getFeatures(clinicId), allFeatures: ALL_FEATURES });
    }

    if (action === 'setFeature') {
      if (!requireRole(user, 'master_admin')) return res.status(403).json({ error: 'Solo master_admin' });
      const { clinicId, feature, enabled } = req.body || {};
      const result = await setFeature(clinicId, feature, enabled);
      return res.status(result.error ? 400 : 200).json(result);
    }

    if (action === 'getClinicFeatures') {
      if (!requireRole(user, 'master_admin')) return res.status(403).json({ error: 'Solo master_admin' });
      return res.status(200).json({ success: true, data: await getAllClinicFeatures() });
    }

    if (action === 'initFeatures') {
      if (!requireRole(user, 'master_admin')) return res.status(403).json({ error: 'Solo master_admin' });
      const clinics = await sql`SELECT id FROM clinics`;
      for (const c of clinics.rows) await seedFeatures(c.id);
      return res.status(200).json({ success: true, message: `Features inicializados para ${clinics.rows.length} clínica(s)` });
    }

    return res.status(400).json({ success: false, error: 'Acción no válida' });

  } catch (error) {
    console.error('❌ Error en auth API:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
}
