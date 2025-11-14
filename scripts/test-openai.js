import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log('🔑 OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Configurada (' + process.env.OPENAI_API_KEY.substring(0, 10) + '...)' : '❌ NO CONFIGURADA');

async function testOpenAI() {
  try {
    console.log('\n🤖 Iniciando prueba de OpenAI...');
    const startTime = Date.now();
    
    const messages = [
      { 
        role: 'system', 
        content: 'Eres un asistente de BIOSKIN. Responde en español, máximo 2 líneas.' 
      },
      { 
        role: 'user', 
        content: 'Hola' 
      }
    ];

    console.log('📤 Enviando mensaje a OpenAI...');
    console.log('Model: gpt-4o-mini');
    console.log('Max tokens: 150');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 150,
      temperature: 0.7,
    });

    const duration = Date.now() - startTime;
    console.log(`\n✅ Respuesta recibida en ${duration}ms`);
    console.log('📥 Respuesta:', completion.choices[0].message.content);
    console.log('🎯 Tokens usados:', completion.usage.total_tokens);
    console.log('   - Prompt:', completion.usage.prompt_tokens);
    console.log('   - Completion:', completion.usage.completion_tokens);
    console.log('✅ Finish reason:', completion.choices[0].finish_reason);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code) console.error('   Code:', error.code);
    if (error.status) console.error('   Status:', error.status);
    console.error('\n   Stack:', error.stack);
  }
}

testOpenAI();
