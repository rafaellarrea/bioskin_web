// test-complete-blog-flow.js
// Test completo: Generar blog → Guardar → Verificar visibilidad en blogs públicos

const BASE_URL = 'http://localhost:3000';

async function testCompleteBlogFlow() {
  console.log('🧪 INICIANDO TEST COMPLETO DE FLUJO DE BLOG');
  console.log('='.repeat(60));

  try {
    // PASO 0: Verificar que el servidor está disponible
    console.log('\n🔗 PASO 0: Verificando conexión con servidor...');
    let serverReady = false;
    for (let i = 0; i < 5; i++) {
      try {
        const healthCheck = await fetch(`${BASE_URL}/api/blogs/manage`);
        if (healthCheck.ok) {
          console.log('✅ Servidor disponible');
          serverReady = true;
          break;
        }
      } catch (error) {
        console.log(`   Intento ${i + 1}/5: Esperando servidor...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!serverReady) {
      throw new Error('Servidor no disponible después de 5 intentos');
    }
    // PASO 1: Generar blog con IA
    console.log('\n📝 PASO 1: Generando blog con IA...');
    const generateResponse = await fetch(`${BASE_URL}/api/ai-blog/generate-production`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        category: 'medico-estetico',
        topic: 'Test de Hidratación Facial'
      })
    });

    console.log(`   Response status: ${generateResponse.status}`);
    console.log(`   Response headers: ${JSON.stringify([...generateResponse.headers.entries()])}`);

    if (!generateResponse.ok) {
      throw new Error(`Error generando blog: ${generateResponse.status}`);
    }

    const generateResult = await generateResponse.json();
    console.log('✅ Blog generado exitosamente:');
    console.log(`   - Título: ${generateResult.blog?.title || 'N/A'}`);
    console.log(`   - Slug: ${generateResult.blog?.slug || 'N/A'}`);
    console.log(`   - Storage: ${JSON.stringify(generateResult.storage)}`);

    const blogSlug = generateResult.blog?.slug;
    if (!blogSlug) {
      throw new Error('No se pudo obtener el slug del blog generado');
    }

    // PASO 2: Verificar que se guardó correctamente usando manage endpoint
    console.log('\n🔍 PASO 2: Verificando almacenamiento en manage endpoint...');
    const manageResponse = await fetch(`${BASE_URL}/api/blogs/manage?slug=${blogSlug}`);
    
    if (!manageResponse.ok) {
      throw new Error(`Error consultando manage endpoint: ${manageResponse.status}`);
    }

    const manageResult = await manageResponse.json();
    console.log('✅ Blog encontrado en manage endpoint:');
    console.log(`   - ID: ${manageResult.blog?.id}`);
    console.log(`   - Título: ${manageResult.blog?.title}`);
    console.log(`   - Source: ${manageResult.blog?.source || 'dynamic'}`);

    // PASO 3: Verificar que aparece en listado público (manage endpoint)
    console.log('\n📋 PASO 3: Verificando listado público (manage)...');
    const listManageResponse = await fetch(`${BASE_URL}/api/blogs/manage?category=medico-estetico&limit=20`);
    
    if (!listManageResponse.ok) {
      throw new Error(`Error obteniendo listado manage: ${listManageResponse.status}`);
    }

    const listManageResult = await listManageResponse.json();
    const foundInManage = listManageResult.blogs?.find(b => b.slug === blogSlug);
    
    if (foundInManage) {
      console.log('✅ Blog encontrado en listado manage:');
      console.log(`   - Posición en lista: ${listManageResult.blogs?.indexOf(foundInManage) + 1}`);
      console.log(`   - Total blogs manage: ${listManageResult.blogs?.length}`);
    } else {
      console.log('❌ Blog NO encontrado en listado manage');
      console.log(`   - Total blogs manage: ${listManageResult.blogs?.length}`);
      console.log(`   - Blogs existentes: ${listManageResult.blogs?.map(b => b.slug).join(', ')}`);
    }

    // PASO 4: Verificar que aparece en static endpoint también
    console.log('\n📋 PASO 4: Verificando listado público (static)...');
    const listStaticResponse = await fetch(`${BASE_URL}/api/blogs/static?category=medico-estetico&limit=20`);
    
    if (!listStaticResponse.ok) {
      throw new Error(`Error obteniendo listado static: ${listStaticResponse.status}`);
    }

    const listStaticResult = await listStaticResponse.json();
    const foundInStatic = listStaticResult.blogs?.find(b => b.slug === blogSlug);
    
    if (foundInStatic) {
      console.log('✅ Blog encontrado en listado static:');
      console.log(`   - Posición en lista: ${listStaticResult.blogs?.indexOf(foundInStatic) + 1}`);
      console.log(`   - Total blogs static: ${listStaticResult.blogs?.length}`);
    } else {
      console.log('❌ Blog NO encontrado en listado static');
      console.log(`   - Total blogs static: ${listStaticResult.blogs?.length}`);
      console.log(`   - Blogs existentes: ${listStaticResult.blogs?.map(b => b.slug).join(', ')}`);
    }

    // PASO 5: Resumen final
    console.log('\n📊 RESUMEN DEL TEST:');
    console.log('='.repeat(40));
    console.log(`✅ Generación: ${generateResult.success ? 'ÉXITO' : 'FALLO'}`);
    console.log(`✅ Storage manage: ${manageResult.success ? 'ÉXITO' : 'FALLO'}`);
    console.log(`${foundInManage ? '✅' : '❌'} Listado manage: ${foundInManage ? 'VISIBLE' : 'NO VISIBLE'}`);
    console.log(`${foundInStatic ? '✅' : '❌'} Listado static: ${foundInStatic ? 'VISIBLE' : 'NO VISIBLE'}`);

    const allPassed = generateResult.success && 
                     manageResult.success && 
                     foundInManage && 
                     foundInStatic;

    console.log(`\n🎯 RESULTADO FINAL: ${allPassed ? '✅ TODOS LOS TESTS PASARON' : '❌ ALGUNOS TESTS FALLARON'}`);

    if (!allPassed) {
      console.log('\n🔧 DIAGNÓSTICO:');
      if (!foundInManage && !foundInStatic) {
        console.log('   - El blog no aparece en ningún endpoint de listado');
        console.log('   - Problema: Desconexión entre generación y storage');
      } else if (!foundInManage) {
        console.log('   - El blog no aparece en manage endpoint');
        console.log('   - Problema: Issue con manage endpoint');
      } else if (!foundInStatic) {
        console.log('   - El blog no aparece en static endpoint');
        console.log('   - Problema: Falta sincronización con static');
      }
    }

    return {
      success: allPassed,
      blogSlug,
      details: {
        generated: generateResult.success,
        storedInManage: manageResult.success,
        visibleInManage: !!foundInManage,
        visibleInStatic: !!foundInStatic
      }
    };

  } catch (error) {
    console.error('\n❌ ERROR EN TEST:', error.message);
    console.error('Stack:', error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

// Ejecutar test
testCompleteBlogFlow()
  .then(result => {
    console.log('\n🏁 Test completado:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });