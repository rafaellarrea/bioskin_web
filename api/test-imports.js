/**
 * Test de diagnóstico de imports
 * Prueba cada módulo individualmente para identificar el problemático
 */

export default async function handler(req, res) {
  const results = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    tests: []
  };

  // Test 1: Import de base de datos Vercel
  try {
    console.log('🧪 Test 1: Importando neon-chatbot-db-vercel.js...');
    const dbModule = await import('../lib/neon-chatbot-db-vercel.js');
    results.tests.push({
      module: 'neon-chatbot-db-vercel.js',
      status: 'SUCCESS',
      exports: Object.keys(dbModule)
    });
    console.log('✅ Test 1 PASSED');
  } catch (error) {
    results.tests.push({
      module: 'neon-chatbot-db-vercel.js',
      status: 'FAILED',
      error: error.message,
      stack: error.stack
    });
    console.error('❌ Test 1 FAILED:', error.message);
  }

  // Test 2: Import de cleanup service
  try {
    console.log('🧪 Test 2: Importando chatbot-cleanup.js...');
    const cleanupModule = await import('../lib/chatbot-cleanup.js');
    results.tests.push({
      module: 'chatbot-cleanup.js',
      status: 'SUCCESS',
      exports: Object.keys(cleanupModule)
    });
    console.log('✅ Test 2 PASSED');
  } catch (error) {
    results.tests.push({
      module: 'chatbot-cleanup.js',
      status: 'FAILED',
      error: error.message,
      stack: error.stack
    });
    console.error('❌ Test 2 FAILED:', error.message);
  }

  // Test 3: Import de AI service
  try {
    console.log('🧪 Test 3: Importando chatbot-ai-service.js...');
    const aiModule = await import('../lib/chatbot-ai-service.js');
    results.tests.push({
      module: 'chatbot-ai-service.js',
      status: 'SUCCESS',
      exports: Object.keys(aiModule)
    });
    console.log('✅ Test 3 PASSED');
  } catch (error) {
    results.tests.push({
      module: 'chatbot-ai-service.js',
      status: 'FAILED',
      error: error.message,
      stack: error.stack
    });
    console.error('❌ Test 3 FAILED:', error.message);
  }

  // Test 4: Import de fallback storage
  try {
    console.log('🧪 Test 4: Importando fallback-storage.js...');
    const fallbackModule = await import('../lib/fallback-storage.js');
    results.tests.push({
      module: 'fallback-storage.js',
      status: 'SUCCESS',
      exports: Object.keys(fallbackModule)
    });
    console.log('✅ Test 4 PASSED');
  } catch (error) {
    results.tests.push({
      module: 'fallback-storage.js',
      status: 'FAILED',
      error: error.message,
      stack: error.stack
    });
    console.error('❌ Test 4 FAILED:', error.message);
  }

  // Test 5: Import de appointment service
  try {
    console.log('🧪 Test 5: Importando chatbot-appointment-service.js...');
    const appointmentModule = await import('../lib/chatbot-appointment-service.js');
    results.tests.push({
      module: 'chatbot-appointment-service.js',
      status: 'SUCCESS',
      exports: Object.keys(appointmentModule)
    });
    console.log('✅ Test 5 PASSED');
  } catch (error) {
    results.tests.push({
      module: 'chatbot-appointment-service.js',
      status: 'FAILED',
      error: error.message,
      stack: error.stack
    });
    console.error('❌ Test 5 FAILED:', error.message);
  }

  // Test 6: Import de state machine
  try {
    console.log('🧪 Test 6: Importando appointment-state-machine.js...');
    const stateMachineModule = await import('../lib/appointment-state-machine.js');
    results.tests.push({
      module: 'appointment-state-machine.js',
      status: 'SUCCESS',
      exports: Object.keys(stateMachineModule)
    });
    console.log('✅ Test 6 PASSED');
  } catch (error) {
    results.tests.push({
      module: 'appointment-state-machine.js',
      status: 'FAILED',
      error: error.message,
      stack: error.stack
    });
    console.error('❌ Test 6 FAILED:', error.message);
  }

  // Test 7: Import de admin notifications
  try {
    console.log('🧪 Test 7: Importando admin-notifications.js...');
    const notificationsModule = await import('../lib/admin-notifications.js');
    results.tests.push({
      module: 'admin-notifications.js',
      status: 'SUCCESS',
      exports: Object.keys(notificationsModule)
    });
    console.log('✅ Test 7 PASSED');
  } catch (error) {
    results.tests.push({
      module: 'admin-notifications.js',
      status: 'FAILED',
      error: error.message,
      stack: error.stack
    });
    console.error('❌ Test 7 FAILED:', error.message);
  }

  // Resumen
  const passedTests = results.tests.filter(t => t.status === 'SUCCESS').length;
  const failedTests = results.tests.filter(t => t.status === 'FAILED').length;
  
  results.summary = {
    total: results.tests.length,
    passed: passedTests,
    failed: failedTests,
    allPassed: failedTests === 0
  };

  console.log('\n📊 RESUMEN DE TESTS:');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);

  // Devolver resultados con el código apropiado
  const statusCode = failedTests === 0 ? 200 : 500;
  return res.status(statusCode).json(results);
}
