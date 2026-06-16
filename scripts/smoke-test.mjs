/**
 * Smoke test multi-tenant en producción.
 * node scripts/smoke-test.mjs [https://saludbioskin.vercel.app]
 */
const BASE = process.argv[2] || 'https://saludbioskin.vercel.app';

async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  return r.json();
}

async function get(path, token) {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const r = await fetch(`${BASE}${path}`, { headers });
  return r.json();
}

let passed = 0, failed = 0;
function check(label, condition, detail = '') {
  if (condition) { console.log(`  ✅ ${label}`); passed++; }
  else { console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`); failed++; }
}

console.log(`\n🧪 Smoke tests → ${BASE}\n`);

// ── Test 1: Login master_admin ─────────────────────────────────────────────
console.log('1. Login master_admin (rafa1227):');
const r1 = await post('/api/admin-auth?action=login', { username: 'rafa1227', password: '19941227rXfx' });
check('success=true', r1.success, JSON.stringify(r1));
check('role=master_admin', r1.user?.role === 'master_admin', r1.user?.role);
check('clinic_id=null (acceso global)', r1.user?.clinic_id === null || r1.user?.clinic_id == null);
check('sessionToken presente', !!r1.sessionToken);
const masterToken = r1.sessionToken;

// ── Test 2: Login clinic_admin ──────────────────────────────────────────────
console.log('\n2. Login clinic_admin (admin):');
const r2 = await post('/api/admin-auth?action=login', { username: 'admin', password: 'b10sk1n' });
check('success=true', r2.success, JSON.stringify(r2));
check('role=clinic_admin', r2.user?.role === 'clinic_admin', r2.user?.role);
check('clinic_id=1 (bioskin)', r2.user?.clinic_id === 1);
const adminToken = r2.sessionToken;

// ── Test 3: Verify session master_admin ────────────────────────────────────
console.log('\n3. Verify session master_admin:');
const r3 = await post('/api/admin-auth?action=verify', {}, masterToken);
check('valid=true', r3.valid, JSON.stringify(r3));
check('role=master_admin', r3.user?.role === 'master_admin');

// ── Test 4: listUsers como master_admin ────────────────────────────────────
console.log('\n4. listUsers como master_admin:');
const r4raw = await get('/api/admin-auth?action=listUsers', masterToken);
// API puede devolver array directo o {success, users}
const users = Array.isArray(r4raw) ? r4raw : (r4raw.users || []);
check('respuesta con datos', users.length > 0 || r4raw.success !== false, JSON.stringify(r4raw).substring(0,300));
check('≥2 usuarios (master+admin)', users.length >= 2, `${users.length} usuarios`);
const master = users.find(u => u.username === 'rafa1227');
const adm    = users.find(u => u.username === 'admin');
check('rafa1227 con rol master_admin', master?.role === 'master_admin', master ? JSON.stringify(master) : 'no encontrado');
check('admin con rol clinic_admin',    adm?.role    === 'clinic_admin',  adm    ? JSON.stringify(adm)    : 'no encontrado');

// ── Test 5: listClinics como master_admin ──────────────────────────────────
console.log('\n5. listClinics como master_admin:');
const r5raw = await get('/api/admin-auth?action=listClinics', masterToken);
const clinics = Array.isArray(r5raw) ? r5raw : (r5raw.clinics || []);
check('≥1 clínica devuelta', clinics.length >= 1, `${clinics.length} clínicas`);
const bioskin = clinics.find(c => c.slug === 'bioskin');
check('clínica bioskin existe', !!bioskin, bioskin ? `id=${bioskin.id}` : 'no encontrada');

// ── Test 6: clinic_admin NO puede listar clínicas ──────────────────────────
console.log('\n6. clinic_admin NO puede listar clínicas (permisos):');
const r6 = await get('/api/admin-auth?action=listClinics', adminToken);
check('denegado para clinic_admin', !r6.success || r6.error);

// ── Resumen ────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Resultado: ${passed} ✅ pasaron — ${failed} ❌ fallaron`);
if (failed === 0) console.log('🎉 Todos los tests pasaron. Sistema multi-tenant operativo.\n');
else console.log('⚠️  Hay fallos. Revisa los detalles arriba.\n');
process.exit(failed > 0 ? 1 : 0);
