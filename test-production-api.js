// test-production-api.js
// Script para probar las APIs de producción desde local

const testProductionAPI = async () => {
  const baseUrl = 'https://bioskin-h9w0ah6iq-rafael-larreas-projects.vercel.app';
  
  console.log('🚀 Probando APIs en PRODUCCIÓN...\n');
  console.log(`Base URL: ${baseUrl}\n`);
  
  // Test 1: Endpoint de diagnóstico
  console.log('1️⃣ Probando endpoint de diagnóstico en producción...');
  try {
    const diagnosticResponse = await fetch(`${baseUrl}/api/blogs/test`);
    const diagnosticData = await diagnosticResponse.json();
    console.log('✅ Diagnóstico en producción:', JSON.stringify(diagnosticData, null, 2));
  } catch (error) {
    console.log('❌ Error en diagnóstico producción:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: Endpoint de producción (sin SQLite)
  console.log('2️⃣ Probando endpoint de producción (sin SQLite)...');
  try {
    const productionResponse = await fetch(`${baseUrl}/api/ai-blog/generate-production`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        blogType: 'medico-estetico',
        topic: 'Tratamiento HIFU para rejuvenecimiento facial sin cirugía',
        manual: false
      })
    });
    
    const productionData = await productionResponse.json();
    console.log('✅ Endpoint de producción:');
    console.log('- Success:', productionData.success);
    console.log('- Message:', productionData.message);
    
    if (productionData.success && productionData.blog) {
      console.log('- Título:', productionData.blog.title);
      console.log('- Categoría:', productionData.blog.category);
      console.log('- Read time:', productionData.blog.read_time);
      console.log('- Tags:', productionData.blog.tags);
      console.log('- Word count:', productionData.meta?.wordCount);
      console.log('- Environment:', productionData.meta?.environment);
    } else {
      console.log('- Error:', productionData.error || 'Sin detalles de error');
    }
    
  } catch (error) {
    console.log('❌ Error en endpoint producción:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 3: Endpoint seguro de generación
  console.log('3️⃣ Probando generación de blog segura...');
  try {
    const blogResponse = await fetch(`${baseUrl}/api/ai-blog/generate-safe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        blogType: 'medico-estetico',
        topic: 'Beneficios del tratamiento HIFU para lifting facial no invasivo',
        manual: false
      })
    });
    
    const blogData = await blogResponse.json();
    console.log('✅ Generación de blog segura:');
    console.log('- Success:', blogData.success);
    console.log('- Message:', blogData.message);
    
    if (blogData.success && blogData.blog) {
      console.log('- Título:', blogData.blog.title);
      console.log('- Categoría:', blogData.blog.category);
      console.log('- Read time:', blogData.blog.readTime || blogData.blog.read_time);
      console.log('- Tags:', blogData.blog.tags);
      console.log('- Using Mock:', blogData.meta?.usingMock);
      console.log('- OpenAI disponible:', blogData.meta?.hasOpenAI);
    } else {
      console.log('- Error:', blogData.error || 'Sin detalles de error');
    }
    
  } catch (error) {
    console.log('❌ Error en generación segura:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 4: Endpoint original
  console.log('4️⃣ Probando endpoint original de generación...');
  try {
    const originalResponse = await fetch(`${baseUrl}/api/ai-blog/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        blogType: 'tecnico'
      })
    });
    
    const originalData = await originalResponse.json();
    console.log('✅ Endpoint original en producción:');
    console.log('- Success:', originalData.success);
    console.log('- Message:', originalData.message);
    
    if (originalData.success && originalData.blog) {
      console.log('- Título:', originalData.blog.title);
      console.log('- Categoría:', originalData.blog.category);
    } else {
      console.log('- Error:', originalData.error || 'Sin detalles de error');
    }
    
  } catch (error) {
    console.log('❌ Error en endpoint original:', error.message);
  }
  
  console.log('\n🎉 Pruebas de producción completadas\n');
};

// Usar fetch de Node.js nativo (disponible en Node 18+)
if (typeof fetch === 'undefined') {
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  global.fetch = fetch;
}

testProductionAPI().catch(console.error);