// init-database.js
// Script para inicializar la base de datos SQLite con las tablas necesarias

import dotenv from 'dotenv';
dotenv.config();

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initDatabase = () => {
  console.log('🗄️ Inicializando base de datos SQLite...\n');
  
  try {
    // Crear o abrir la base de datos
    const dbPath = join(__dirname, 'data', 'blogs.db');
    const db = new Database(dbPath);
    
    console.log('📁 Base de datos creada en:', dbPath);
    
    // Crear tabla blogs con todas las columnas necesarias
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS blogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        excerpt TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('medico-estetico', 'tecnico')),
        blog_type TEXT NOT NULL CHECK (blog_type IN ('medico-estetico', 'tecnico')),
        author TEXT NOT NULL,
        published_at DATE NOT NULL,
        read_time INTEGER NOT NULL,
        image TEXT,
        featured BOOLEAN DEFAULT 0,
        week_year TEXT NOT NULL,
        is_ai_generated BOOLEAN DEFAULT 1,
        ai_prompt_version TEXT DEFAULT 'v1.0',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    db.exec(createTableSQL);
    console.log('✅ Tabla "blogs" creada exitosamente');
    
    // Crear tabla de tags
    const createTagsSQL = `
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    db.exec(createTagsSQL);
    console.log('✅ Tabla "tags" creada exitosamente');
    
    // Crear tabla de relación blog-tags
    const createBlogTagsSQL = `
      CREATE TABLE IF NOT EXISTS blog_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        blog_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
        UNIQUE(blog_id, tag_id)
      )
    `;
    
    db.exec(createBlogTagsSQL);
    console.log('✅ Tabla "blog_tags" creada exitosamente');
    
    // Crear tabla de citas/referencias
    const createCitationsSQL = `
      CREATE TABLE IF NOT EXISTS citations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        blog_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        source TEXT NOT NULL,
        url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE
      )
    `;
    
    db.exec(createCitationsSQL);
    console.log('✅ Tabla "citations" creada exitosamente');
    
    // Crear índices para optimizar consultas
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);
      CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(published_at);
      CREATE INDEX IF NOT EXISTS idx_blogs_featured ON blogs(featured);
      CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
    `;
    
    db.exec(createIndexesSQL);
    console.log('✅ Índices creados exitosamente');
    
    // Verificar la estructura de la tabla
    const tableInfo = db.prepare("PRAGMA table_info(blogs)").all();
    console.log('\n📋 Estructura de la tabla blogs:');
    tableInfo.forEach(column => {
      console.log(`  - ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    const tagsInfo = db.prepare("PRAGMA table_info(tags)").all();
    console.log('\n📋 Estructura de la tabla tags:');
    tagsInfo.forEach(column => {
      console.log(`  - ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    // Insertar datos de ejemplo si la tabla está vacía
    const countRows = db.prepare("SELECT COUNT(*) as count FROM blogs").get();
    console.log(`\n📊 Registros existentes: ${countRows.count}`);
    
    if (countRows.count === 0) {
      console.log('📝 Insertando blog de ejemplo...');
      
      const insertExample = db.prepare(`
        INSERT INTO blogs (
          title, slug, excerpt, content, category, blog_type, author, 
          published_at, read_time, week_year, is_ai_generated, ai_prompt_version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const getCurrentWeekYear = () => {
        const date = new Date();
        const week = getWeekNumber(date);
        return `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
      };
      
      const getWeekNumber = (date) => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      };
      
      const exampleBlog = {
        title: "Bienvenidos al sistema de blogs de BIOSKIN",
        slug: "bienvenidos-sistema-blogs-bioskin",
        excerpt: "Descubre nuestro nuevo sistema automatizado de generación de contenido médico-estético con inteligencia artificial.",
        content: `# Bienvenidos al sistema de blogs de BIOSKIN

## Una nueva era en medicina estética

En BIOSKIN, estamos comprometidos con la innovación y la excelencia en medicina estética. Por eso, hemos desarrollado un sistema automatizado de generación de contenido que nos permite ofrecerte información actualizada y relevante sobre los últimos avances en tratamientos estéticos.

### ¿Qué encontrarás en nuestros blogs?

#### Contenido Médico-Estético
- Tratamientos de rejuvenecimiento facial
- Tecnologías HIFU para lifting no invasivo
- Medicina regenerativa y exosomas
- Protocolos de hidratación profunda

#### Contenido Técnico
- Últimas innovaciones en equipamiento médico
- Análisis de tecnologías láser
- Sistemas de radiofrecuencia avanzada
- Equipos de diagnóstico computarizado

### Nuestra tecnología

Utilizamos inteligencia artificial de última generación para crear contenido que combine:

- **Precisión médica**: Información respaldada por evidencia científica
- **Actualización constante**: Nuevos artículos dos veces por semana
- **Lenguaje accesible**: Explicaciones claras para todos los lectores
- **Casos reales**: Experiencias de nuestros pacientes

### Compromiso con la calidad

Cada artículo pasa por un riguroso proceso de:

1. **Generación automatizada** con prompts especializados
2. **Revisión médica** por nuestro equipo de especialistas
3. **Validación técnica** de equipos y procedimientos
4. **Optimización SEO** para mejor alcance

*En BIOSKIN, la tecnología está al servicio de tu belleza y bienestar.*

**¿Listo para descubrir todo lo que podemos hacer por ti? [Agenda tu consulta](/#appointment) hoy mismo.**`,
        category: "medico-estetico",
        tags: "bioskin,medicina-estetica,ia,tecnologia,innovacion",
        read_time: 4,
        author: "BIOSKIN IA",
        published_at: new Date().toISOString().split('T')[0],
        blog_type: "medico-estetico",
        week_year: getCurrentWeekYear(),
        is_ai_generated: 1,
        ai_prompt_version: "v2.0-init"
      };
      
      insertExample.run(
        exampleBlog.title,
        exampleBlog.slug,
        exampleBlog.excerpt,
        exampleBlog.content,
        exampleBlog.category,
        exampleBlog.blog_type,
        exampleBlog.author,
        exampleBlog.published_at,
        exampleBlog.read_time,
        exampleBlog.week_year,
        exampleBlog.is_ai_generated,
        exampleBlog.ai_prompt_version
      );
      
      console.log('✅ Blog de ejemplo insertado');
    }
    
    // Cerrar conexión
    db.close();
    console.log('\n🎉 Base de datos inicializada correctamente');
    
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    process.exit(1);
  }
};

// Ejecutar inicialización
initDatabase();