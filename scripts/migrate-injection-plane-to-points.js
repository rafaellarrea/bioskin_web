/**
 * Migración: injection_plane de campo global a campo por-punto
 * ============================================================
 * Contexto:
 *   - El campo `injection_plane` existía como columna en la tabla `injectables`.
 *   - Ahora se almacena por punto de inyección dentro de `mapping_data.injectionPoints[].injection_plane`.
 *   - Este script:
 *     1. Busca todos los registros con injection_plane != '' y mapping_data con puntos.
 *     2. Copia el valor de injection_plane a cada punto de inyección (si el punto no tiene ya uno).
 *     3. Actualiza mapping_data en la base de datos.
 *     4. Elimina (DROP) la columna injection_plane de la tabla injectables.
 *
 * USO:
 *   node scripts/migrate-injection-plane-to-points.js
 *
 * PREREQUISITOS:
 *   - Variables de entorno: NEON_DATABASE_URL o POSTGRES_URL
 *   - Ejecutar ANTES de desplegar la nueva versión del frontend
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Pool } = require('pg');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ No se encontró cadena de conexión (NEON_DATABASE_URL o POSTGRES_URL)');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  console.log('✅ Conectado a la base de datos Neon\n');

  try {
    await client.query('BEGIN');

    // ── 1. Verificar que la columna injection_plane existe ────────────────
    const colCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'injectables'
        AND column_name = 'injection_plane'
        AND table_schema = 'public'
    `);

    if (colCheck.rows.length === 0) {
      console.log('⚠️  La columna injection_plane ya no existe en injectables. Migración ya aplicada o no necesaria.');
      await client.query('ROLLBACK');
      return;
    }

    // ── 2. Obtener registros con injection_plane definido ─────────────────
    const { rows: injectables } = await client.query(`
      SELECT id, injection_plane, mapping_data
      FROM injectables
      WHERE injection_plane IS NOT NULL
        AND injection_plane <> ''
    `);

    console.log(`📋 Registros con injection_plane global: ${injectables.length}`);

    let migratedCount = 0;
    let pointsMigratedTotal = 0;

    for (const row of injectables) {
      const globalPlane = row.injection_plane;

      // Parsear mapping_data
      let mappingData = row.mapping_data;
      if (typeof mappingData === 'string') {
        try {
          mappingData = JSON.parse(mappingData);
        } catch {
          console.warn(`  ⚠️  Injectable ID=${row.id}: mapping_data inválido, omitiendo.`);
          continue;
        }
      }

      // Soportar formato legacy (array) y nuevo (objeto con injectionPoints)
      let injectionPoints = [];
      let isLegacy = false;

      if (Array.isArray(mappingData)) {
        isLegacy = true;
        injectionPoints = mappingData;
      } else if (mappingData && typeof mappingData === 'object') {
        injectionPoints = Array.isArray(mappingData.injectionPoints)
          ? mappingData.injectionPoints
          : [];
      }

      if (injectionPoints.length === 0) {
        console.log(`  ℹ️  Injectable ID=${row.id}: sin puntos registrados, copiando plano igualmente al primer punto si hay.`);
        // No hay puntos; no hay nada que migrar en mapping_data
        continue;
      }

      // Copiar injection_plane a cada punto que no tenga ya uno asignado
      let pointsUpdated = 0;
      const updatedPoints = injectionPoints.map(pt => {
        if (!pt.injection_plane) {
          pointsUpdated++;
          return { ...pt, injection_plane: globalPlane };
        }
        return pt;
      });

      // Reconstituir mapping_data
      let newMappingData;
      if (isLegacy) {
        newMappingData = updatedPoints;
      } else {
        newMappingData = { ...mappingData, injectionPoints: updatedPoints };
      }

      // Actualizar en DB
      await client.query(
        'UPDATE injectables SET mapping_data = $1 WHERE id = $2',
        [JSON.stringify(newMappingData), row.id]
      );

      console.log(`  ✅ Injectable ID=${row.id} | plano="${globalPlane}" → ${pointsUpdated} punto(s) actualizados`);
      migratedCount++;
      pointsMigratedTotal += pointsUpdated;
    }

    console.log(`\n📊 Resumen de migración de datos:`);
    console.log(`   Registros procesados: ${migratedCount}/${injectables.length}`);
    console.log(`   Puntos actualizados: ${pointsMigratedTotal}`);

    // ── 3. Eliminar la columna injection_plane ────────────────────────────
    console.log('\n🗑️  Eliminando columna injection_plane de la tabla injectables...');
    await client.query('ALTER TABLE injectables DROP COLUMN IF EXISTS injection_plane');
    console.log('✅ Columna injection_plane eliminada correctamente.');

    await client.query('COMMIT');
    console.log('\n🎉 Migración completada exitosamente.\n');
    console.log('PRÓXIMOS PASOS:');
    console.log('  1. Despliega la nueva versión del frontend (plano de inyección por-punto).');
    console.log('  2. El campo injection_plane ya no aparece en el formulario principal.');
    console.log('  3. Se selecciona por punto en el mapa 3D (paso 4 del modal).');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error durante la migración:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
