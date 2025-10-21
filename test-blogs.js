// test-blogs.js - Script para verificar el estado de los blogs
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testBlogs() {
  console.log('🔍 Verificando estado de blogs...\n');

  // 1. Verificar base de datos
  const dbPath = join(__dirname, 'data', 'blogs.db');
  console.log(`📁 Verificando base de datos: ${dbPath}`);
  if (existsSync(dbPath)) {
    const stats = await import('fs').then(fs => fs.promises.stat(dbPath));
    console.log(`✅ Base de datos existe - Tamaño: ${stats.size} bytes`);
  } else {
    console.log('❌ Base de datos no encontrada');
  }

  // 2. Verificar blogs estáticos
  try {
    const blogPostsPath = join(__dirname, 'src', 'data', 'blogPosts.js');
    if (existsSync(blogPostsPath)) {
      console.log(`✅ Archivo de blogs estáticos encontrado: ${blogPostsPath}`);
      const { default: blogPosts } = await import('./src/data/blogPosts.js');
      console.log(`📊 Blogs estáticos disponibles: ${blogPosts.length}`);
      if (blogPosts.length > 0) {
        console.log(`   📝 Primer blog: "${blogPosts[0].title}"`);
      }
    } else {
      console.log('❌ Archivo de blogs estáticos no encontrado');
    }
  } catch (error) {
    console.log(`⚠️ Error leyendo blogs estáticos: ${error.message}`);
  }

  // 3. Verificar estructura de API
  console.log('\n🔧 Verificando estructura de API:');
  const apiPaths = [
    'api/blogs/manage.js',
    'api/blogs/index.js', 
    'api/blogs/static.js',
    'api/blogs/[slug].js'
  ];

  apiPaths.forEach(path => {
    const fullPath = join(__dirname, path);
    if (existsSync(fullPath)) {
      console.log(`✅ ${path}`);
    } else {
      console.log(`❌ ${path}`);
    }
  });

  console.log('\n✨ Verificación completada');
}

testBlogs().catch(console.error);