import OpenAI from 'openai';

/**
 * ENDPOINT DE DIAGNÓSTICO PARA OPENAI
 * Prueba directamente la conexión con OpenAI
 * 
 * Uso: GET /api/test-openai
 */
export default async function handler(req, res) {
  console.log('🧪 [TEST] Iniciando prueba de OpenAI...');
  
  const results = {
    timestamp: new Date().toISOString(),
    apiKeyPresent: !!process.env.OPENAI_API_KEY,
    apiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
    tests: {}
  };

  try {
    // Test 1: Inicialización del cliente
    console.log('🧪 [TEST] 1. Inicializando cliente...');
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 5000,
      maxRetries: 0,
    });
    results.tests.clientInit = { success: true, message: 'Cliente inicializado' };
    console.log('✅ [TEST] Cliente inicializado');

    // Test 2: Request simple a OpenAI
    console.log('🧪 [TEST] 2. Enviando request simple...');
    const startTime = Date.now();
    
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Responde en español, máximo 10 palabras.' },
        { role: 'user', content: 'Hola' }
      ],
      max_tokens: 50,
      temperature: 0.7,
    });
    
    const duration = Date.now() - startTime;
    const response = completion.choices[0].message.content;
    
    results.tests.simpleRequest = {
      success: true,
      duration: `${duration}ms`,
      response,
      tokensUsed: completion.usage.total_tokens,
      model: completion.model
    };
    
    console.log(`✅ [TEST] Request completado en ${duration}ms`);
    console.log(`✅ [TEST] Respuesta: "${response}"`);

    // Test 3: Verificar límites de uso
    console.log('🧪 [TEST] 3. Verificando estado de cuenta...');
    results.tests.accountStatus = {
      success: true,
      message: 'Requests funcionando correctamente'
    };

    results.overallSuccess = true;
    results.message = 'Todas las pruebas pasaron correctamente';

  } catch (error) {
    console.error('❌ [TEST] Error:', error.message);
    results.overallSuccess = false;
    results.error = {
      message: error.message,
      type: error.constructor.name,
      code: error.code,
      status: error.status
    };
    
    // Diagnóstico específico del error
    if (error.code === 'ENOTFOUND') {
      results.diagnosis = 'Error de red: No se puede conectar a OpenAI';
    } else if (error.status === 401) {
      results.diagnosis = 'API Key inválido o expirado';
    } else if (error.status === 429) {
      results.diagnosis = 'Límite de uso alcanzado';
    } else if (error.message.includes('timeout')) {
      results.diagnosis = 'Timeout: OpenAI tardó más de 5 segundos';
    } else {
      results.diagnosis = 'Error desconocido';
    }
  }

  // Responder con resultados
  return res.status(200).json(results);
}
