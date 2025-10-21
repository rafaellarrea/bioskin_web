// debug-blog-sources.js - Script para debuggear fuentes de blogs
import { readFileSync, existsSync } from 'fs';
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function debugBlogSources() {
  console.log('🔍 DEBUGGING BLOG SOURCES\n');

  // 1. Verificar blogs estáticos en manage.js
  console.log('📁 BLOGS ESTÁTICOS (manage.js):');
  try {
    const manageContent = readFileSync(join(__dirname, 'api', 'blogs', 'manage.js'), 'utf8');
    const staticMatch = manageContent.match(/const blogPosts = \[[\s\S]*?\];/);
    if (staticMatch) {
      const staticCount = (staticMatch[0].match(/\{[\s\S]*?\}/g) || []).length;
      console.log(`✅ ${staticCount} blogs estáticos encontrados en manage.js`);
    }
  } catch (error) {
    console.log('❌ Error leyendo manage.js:', error.message);
  }

  // 2. Verificar base de datos SQLite
  console.log('\n🗄️ BASE DE DATOS SQLite:');
  const dbPath = join(__dirname, 'data', 'blogs.db');
  
  if (existsSync(dbPath)) {
    try {
      const db = new Database(dbPath, { readonly: true });
      
      // Verificar tablas existentes
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      console.log(`📊 Tablas encontradas: ${tables.map(t => t.name).join(', ')}`);
      
      // Contar blogs en la tabla blogs (si existe)
      try {
        const blogCount = db.prepare("SELECT COUNT(*) as count FROM blogs").get();
        console.log(`📝 Blogs en DB: ${blogCount.count}`);
        
        // Mostrar algunos blogs de ejemplo
        const sampleBlogs = db.prepare("SELECT id, title, category, published_at FROM blogs LIMIT 5").all();
        console.log('📋 Blogs de muestra:');
        sampleBlogs.forEach((blog, i) => {
          console.log(`   ${i+1}. "${blog.title}" (${blog.category}) - ${blog.published_at}`);
        });
      } catch (error) {
        console.log('⚠️  Tabla blogs no existe o está vacía');
      }
      
      db.close();
    } catch (error) {
      console.log('❌ Error accediendo a la base de datos:', error.message);
    }
  } else {
    console.log('❌ Base de datos no encontrada');
  }

  // 3. Verificar otros archivos de blogs
  console.log('\n📂 OTROS ARCHIVOS DE BLOGS:');
  
  const blogFiles = [
    'src/data/blogs.ts',
    'src/data/blogPosts.js',
    'api/blogs/static.js'
  ];
  
  blogFiles.forEach(file => {
    const filePath = join(__dirname, file);
    if (existsSync(filePath)) {
      console.log(`✅ ${file} existe`);
      try {
        const content = readFileSync(filePath, 'utf8');
        const matches = content.match(/\{[\s\S]*?title[\s\S]*?\}/g) || [];
        console.log(`   📝 ~${matches.length} blogs encontrados`);
      } catch (error) {
        console.log(`   ❌ Error leyendo: ${error.message}`);
      }
    } else {
      console.log(`❌ ${file} no existe`);
    }
  });

  console.log('\n✨ Debugging completado');
}

debugBlogSources().catch(console.error);