/**
 * Endpoint de diagnóstico para autenticación de admin
 * Verifica credenciales, variables de entorno y conexión a BD
 */

export default async function handler(req, res) {
  console.log('🧪 [TEST AUTH] Iniciando diagnóstico...');
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: {},
    credentialsTest: {},
    databaseTest: {}
  };

  // 1. Verificar variables de entorno
  console.log('🔍 [TEST AUTH] Verificando variables de entorno...');
  results.environment = {
    hasAdminUsername: !!process.env.ADMIN_USERNAME,
    adminUsernameValue: process.env.ADMIN_USERNAME || 'admin (default)',
    hasAdminPassword: !!process.env.ADMIN_PASSWORD,
    adminPasswordLength: process.env.ADMIN_PASSWORD?.length || 7,
    hasPostgresUrl: !!process.env.POSTGRES_URL
  };

  // 2. Test de credenciales
  console.log('🔍 [TEST AUTH] Probando credenciales...');
  const testUsername = 'admin';
  const testPassword = 'b10sk1n';
  
  const validUsername = process.env.ADMIN_USERNAME || 'admin';
  const validPassword = process.env.ADMIN_PASSWORD || 'b10sk1n';
  
  results.credentialsTest = {
    testUsername,
    testPasswordLength: testPassword.length,
    expectedUsername: validUsername,
    expectedPasswordLength: validPassword.length,
    usernameMatches: testUsername === validUsername,
    passwordMatches: testPassword === validPassword,
    authWillWork: testUsername === validUsername && testPassword === validPassword
  };

  // 3. Test de base de datos
  console.log('🔍 [TEST AUTH] Probando conexión a base de datos...');
  if (process.env.POSTGRES_URL) {
    try {
      const { sql } = await import('@vercel/postgres');
      
      // Probar conexión simple
      const testQuery = await sql`SELECT NOW() as current_time`;
      
      results.databaseTest = {
        connected: true,
        currentTime: testQuery.rows[0]?.current_time
      };
      
      // Verificar si existe la tabla de sesiones
      try {
        const tableCheck = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'admin_sessions'
          ) as table_exists
        `;
        
        results.databaseTest.sessionTableExists = tableCheck.rows[0]?.table_exists || false;
        
        if (results.databaseTest.sessionTableExists) {
          const sessionCount = await sql`
            SELECT COUNT(*) as count FROM admin_sessions WHERE is_active = true
          `;
          results.databaseTest.activeSessions = parseInt(sessionCount.rows[0]?.count || 0);
        }
      } catch (error) {
        results.databaseTest.sessionTableExists = false;
        results.databaseTest.tableCheckError = error.message;
      }
      
      console.log('✅ [TEST AUTH] Conexión a BD exitosa');
    } catch (error) {
      console.error('❌ [TEST AUTH] Error conectando a BD:', error);
      results.databaseTest = {
        connected: false,
        error: error.message,
        stack: error.stack
      };
    }
  } else {
    results.databaseTest = {
      connected: false,
      error: 'POSTGRES_URL no configurado'
    };
  }

  // 4. Resumen
  results.summary = {
    environmentOk: results.environment.hasAdminUsername && results.environment.hasAdminPassword && results.environment.hasPostgresUrl,
    credentialsOk: results.credentialsTest.authWillWork,
    databaseOk: results.databaseTest.connected && results.databaseTest.sessionTableExists,
    overallStatus: null
  };

  results.summary.overallStatus = 
    results.summary.environmentOk && 
    results.summary.credentialsOk && 
    results.summary.databaseOk ? 'READY' : 'NEEDS_CONFIGURATION';

  // 5. Recomendaciones
  results.recommendations = [];
  
  if (!results.environment.hasPostgresUrl) {
    results.recommendations.push({
      priority: 'CRITICAL',
      issue: 'Base de datos no configurada',
      solution: 'Configurar POSTGRES_URL en variables de entorno de Vercel'
    });
  }
  
  if (!results.databaseTest.sessionTableExists && results.databaseTest.connected) {
    results.recommendations.push({
      priority: 'HIGH',
      issue: 'Tabla admin_sessions no existe',
      solution: 'Llamar al endpoint: GET /api/admin-auth?action=init'
    });
  }
  
  if (!results.credentialsTest.authWillWork) {
    results.recommendations.push({
      priority: 'MEDIUM',
      issue: 'Credenciales de prueba no coinciden con configuradas',
      solution: 'Verificar ADMIN_USERNAME y ADMIN_PASSWORD en Vercel. Defaults: admin / b10sk1n'
    });
  }

  console.log('✅ [TEST AUTH] Diagnóstico completado');
  console.log('📊 [TEST AUTH] Estado:', results.summary.overallStatus);

  return res.status(200).json(results);
}
