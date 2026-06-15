#!/usr/bin/env node
/**
 * Script one-shot: inicializa el esquema multi-tenant en producción.
 * 
 * Uso local (vercel dev corriendo):
 *   node scripts/init-multi-tenant.js
 *
 * Uso producción:
 *   node scripts/init-multi-tenant.js https://tu-dominio.vercel.app
 *
 * Requiere: ADMIN_SETUP_SECRET definido como variable de entorno (o en .env).
 *
 * Qué hace:
 *   1. Crea tablas `clinics` y `clinic_users`
 *   2. Extiende `admin_sessions`, `patients` con columnas de tenant
 *   3. Seed clínica "bioskin"
 *   4. Seed master_admin desde MASTER_ADMIN_USERNAME / MASTER_ADMIN_PASSWORD
 *   5. Seed clinic_admin bioskin desde ADMIN_USERNAME / ADMIN_PASSWORD
 *   6. Migra pacientes existentes → clinic bioskin
 */

import 'dotenv/config'; // carga .env si existe (dev local)

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const SECRET   = process.env.ADMIN_SETUP_SECRET;

if (!SECRET) {
  console.error('❌ ADMIN_SETUP_SECRET no está definido.');
  console.error('   Agrega ADMIN_SETUP_SECRET=tu-secreto al archivo .env o como variable de entorno.');
  process.exit(1);
}

console.log(`🚀 Inicializando multi-tenant en: ${BASE_URL}`);
console.log('   Enviando petición...\n');

try {
  const response = await fetch(`${BASE_URL}/api/admin-auth?action=initMultiTenant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-setup-secret': SECRET
    }
  });

  const data = await response.json();

  if (data.success) {
    console.log('✅ Multi-tenant inicializado correctamente');
    console.log(`   Clínica bioskin ID: ${data.bioskinId}`);
    console.log('\n📋 Resumen:');
    console.log('   • Tablas clinics y clinic_users creadas');
    console.log('   • Columnas tenant añadidas a admin_sessions y patients');
    console.log('   • master_admin creado desde MASTER_ADMIN_USERNAME/MASTER_ADMIN_PASSWORD');
    console.log('   • clinic_admin bioskin creado desde ADMIN_USERNAME/ADMIN_PASSWORD');
    console.log('   • Pacientes existentes migrados a clínica bioskin');
    console.log('\n⚠️  Recuerda definir en Vercel las variables de entorno:');
    console.log('   MASTER_ADMIN_USERNAME=rafa1227');
    console.log('   MASTER_ADMIN_PASSWORD=<tu-contraseña-segura>');
  } else {
    console.error('❌ Error:', data.error || JSON.stringify(data));
    process.exit(1);
  }
} catch (err) {
  console.error('❌ Error de red:', err.message);
  console.error('   ¿Está corriendo vercel dev? Asegúrate que el servidor esté activo.');
  process.exit(1);
}
