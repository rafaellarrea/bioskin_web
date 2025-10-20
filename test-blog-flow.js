// test-blog-flow.js
// Script para probar el flujo completo de generación y visualización de blogs

async function testBlogFlow() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔍 Iniciando test del flujo completo de blogs...\n');
  
  // 1. Verificar endpoint de gestión
  console.log('1. Probando endpoint de gestión...');
  try {
    const manageResponse = await fetch(`${baseUrl}/api/blogs/manage`);
    const manageData = await manageResponse.json();
    console.log('✅ Endpoint gestión funcionando:', manageData.success);
    console.log(`📊 Blogs encontrados: ${manageData.blogs ? manageData.blogs.length : 0}`);
    console.log(`📈 Estadísticas:`, manageData.stats);
  } catch (error) {
    console.error('❌ Error en endpoint gestión:', error.message);
  }
  
  console.log('\n2. Generando nuevo blog con IA...');
  
  // 2. Generar nuevo blog
  const blogRequest = {
    blogType: 'medico-estetico',
    topic: 'Beneficios del ácido hialurónico en tratamientos faciales',
    manual: true
  };
  
  try {
    const generateResponse = await fetch(`${baseUrl}/api/ai-blog/generate-production`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blogRequest)
    });
    
    const generateResult = await generateResponse.json();
    console.log('✅ Generación exitosa:', generateResult.success);
    console.log('📝 Blog creado:', generateResult.blog?.title);
    console.log('🔗 Slug:', generateResult.blog?.slug);
    console.log('💾 Método guardado:', generateResult.meta?.saveMethod);
    
    if (generateResult.success && generateResult.blog) {
      const blogSlug = generateResult.blog.slug;
      
      // 3. Verificar que el blog aparece en la lista
      console.log('\n3. Verificando que el blog aparece en la lista...');
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar un segundo
      
      const listResponse = await fetch(`${baseUrl}/api/blogs/manage`);
      const listData = await listResponse.json();
      
      const foundBlog = listData.blogs?.find(b => b.slug === blogSlug);
      
      if (foundBlog) {
        console.log('✅ Blog encontrado en la lista pública');
        console.log('📖 Título:', foundBlog.title);
        console.log('🏷️ Categoría:', foundBlog.category);
        console.log('📍 Fuente:', foundBlog.source);
      } else {
        console.log('❌ Blog NO encontrado en la lista pública');
        console.log('🔍 Blogs disponibles:', listData.blogs?.map(b => b.title) || []);
      }
      
      // 4. Verificar endpoint individual
      console.log('\n4. Verificando endpoint individual...');
      
      const individualResponse = await fetch(`${baseUrl}/api/blogs/manage?slug=${blogSlug}`);
      const individualData = await individualResponse.json();
      
      if (individualData.success) {
        console.log('✅ Blog accesible individualmente');
        console.log('📄 Contenido length:', individualData.blog.content?.length || 0);
      } else {
        console.log('❌ Blog NO accesible individualmente');
      }
      
      // 5. Verificar en endpoint estático (fallback)
      console.log('\n5. Verificando endpoint estático...');
      
      const staticResponse = await fetch(`${baseUrl}/api/blogs/static`);
      const staticData = await staticResponse.json();
      
      const staticFoundBlog = staticData.blogs?.find(b => b.slug === blogSlug);
      
      if (staticFoundBlog) {
        console.log('✅ Blog también en endpoint estático');
      } else {
        console.log('⚠️ Blog NO en endpoint estático');
      }
      
    }
    
  } catch (error) {
    console.error('❌ Error generando blog:', error.message);
  }
  
  console.log('\n🏁 Test completado.');
}

// Ejecutar test si es llamado directamente
if (typeof window === 'undefined') {
  // Node.js environment
  import('node-fetch').then(({ default: fetch }) => {
    global.fetch = fetch;
    testBlogFlow();
  });
} else {
  // Browser environment
  testBlogFlow();
}

export { testBlogFlow };