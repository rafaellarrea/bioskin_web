// test-openai.js
// Script de prueba para verificar configuración de OpenAI

async function testOpenAI() {
  try {
    console.log('🧪 Probando la API de generación de blogs...');
    
    const response = await fetch('http://localhost:5173/api/ai-blog/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category: 'medico-estetico',
        topic: 'Beneficios del ácido hialurónico en medicina estética',
        manual: true
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ ¡API funcionando correctamente!');
      console.log('📄 Blog generado:', data.blog.title);
      console.log('🏷️ Tags:', data.blog.tags.join(', '));
      console.log('⏱️ Tiempo de lectura:', data.blog.readTime, 'minutos');
    } else {
      console.log('❌ Error en la API:', data.message);
    }

  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    console.log('💡 Asegúrate de que el servidor esté corriendo en localhost:5173');
  }
}

testOpenAI();