// test-blog-generation.js
// Script para probar la generación de blogs localmente

const testEndpoint = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Iniciando pruebas de generación de blogs...\n');
  
  // Test 1: Endpoint de diagnóstico
  console.log('1️⃣ Probando endpoint de diagnóstico...');
  try {
    const diagnosticResponse = await fetch(`${baseUrl}/api/blogs/test`);
    const diagnosticData = await diagnosticResponse.json();
    console.log('✅ Diagnóstico exitoso:', diagnosticData);
  } catch (error) {
    console.log('❌ Error en diagnóstico:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: Endpoint seguro de generación
  console.log('2️⃣ Probando endpoint seguro de generación...');
  try {
    const blogResponse = await fetch(`${baseUrl}/api/ai-blog/generate-safe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        blogType: 'medico-estetico',
        topic: 'Beneficios del tratamiento con HIFU para rejuvenecimiento facial',
        manual: false
      })
    });
    
    const blogData = await blogResponse.json();
    console.log('✅ Generación de blog:', blogData);
    
    if (blogData.success) {
      console.log('\n📝 Blog generado:');
      console.log('Título:', blogData.blog.title);
      console.log('Categoría:', blogData.blog.category);
      console.log('Usando Mock:', blogData.meta.usingMock);
      console.log('OpenAI disponible:', blogData.meta.hasOpenAI);
    }
    
  } catch (error) {
    console.log('❌ Error en generación:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 3: Endpoint original
  console.log('3️⃣ Probando endpoint original...');
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
    console.log('✅ Endpoint original:', originalData);
    
  } catch (error) {
    console.log('❌ Error en endpoint original:', error.message);
  }
};

// Ejecutar pruebas si se llama directamente
if (typeof window === 'undefined') {
  // Entorno Node.js
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  testEndpoint().catch(console.error);
} else {
  // Entorno navegador
  testEndpoint().catch(console.error);
}

export default testEndpoint;