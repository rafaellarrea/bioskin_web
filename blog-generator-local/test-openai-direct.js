// test-openai-direct.js - Prueba directa de OpenAI
require('dotenv').config();
const OpenAI = require('openai');

async function testOpenAI() {
  console.log('🔍 Probando configuración de OpenAI...\n');
  
  // Verificar API Key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY no encontrada en .env');
    return;
  }
  
  console.log('✅ API Key encontrada');
  console.log(`🔑 API Key (primeros 10 chars): ${process.env.OPENAI_API_KEY.substring(0, 10)}...`);
  
  try {
    // Configurar OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    console.log('🔄 Iniciando prueba con OpenAI...\n');
    
    // Prueba simple
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "Eres un experto en medicina estética que escribe para BIOSKIN." 
        },
        { 
          role: "user", 
          content: "Escribe un párrafo corto sobre los beneficios del ácido hialurónico en medicina estética." 
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    });
    
    console.log('✅ ¡ÉXITO! OpenAI respondió correctamente\n');
    console.log('📝 Respuesta generada:');
    console.log('=' .repeat(50));
    console.log(completion.choices[0].message.content);
    console.log('=' .repeat(50));
    console.log('\n📊 Estadísticas:');
    console.log(`   Modelo usado: ${completion.model}`);
    console.log(`   Tokens usados: ${completion.usage?.total_tokens || 'N/A'}`);
    console.log(`   Tokens prompt: ${completion.usage?.prompt_tokens || 'N/A'}`);
    console.log(`   Tokens respuesta: ${completion.usage?.completion_tokens || 'N/A'}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('📋 Código de error:', error.code || 'unknown');
    
    if (error.code === 'invalid_api_key') {
      console.error('🔧 SOLUCIÓN: Verifica que tu API key sea correcta');
    } else if (error.code === 'insufficient_quota') {
      console.error('🔧 SOLUCIÓN: Tu cuenta de OpenAI necesita fondos');
    } else if (error.code === 'rate_limit_exceeded') {
      console.error('🔧 SOLUCIÓN: Espera unos minutos e intenta de nuevo');
    }
    
    return false;
  }
}

// Ejecutar prueba
testOpenAI().then(success => {
  console.log('\n' + '='.repeat(60));
  if (success) {
    console.log('🎉 CONFIGURACIÓN CORRECTA - El generador debería funcionar');
  } else {
    console.log('💥 PROBLEMA DETECTADO - Revisa la configuración');
  }
  console.log('='.repeat(60));
});