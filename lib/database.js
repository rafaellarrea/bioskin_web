// lib/database.js

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta de la base de datos
const dbPath = path.join(__dirname, '..', 'data', 'blogs.db');

// Crear conexión a la base de datos
const db = new Database(dbPath);

// Crear tablas si no existen
function initializeDatabase() {
  // Tabla de blogs
  db.exec(`
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
      week_year TEXT NOT NULL, -- Formato: 2025-W42 para controlar límites semanales
      is_ai_generated BOOLEAN DEFAULT 1,
      ai_prompt_version TEXT DEFAULT 'v1.0',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de tags
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de relación blog-tags (muchos a muchos)
  db.exec(`
    CREATE TABLE IF NOT EXISTS blog_tags (
      blog_id INTEGER,
      tag_id INTEGER,
      PRIMARY KEY (blog_id, tag_id),
      FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);

  // Tabla de citas/referencias
  db.exec(`
    CREATE TABLE IF NOT EXISTS citations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      blog_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      source TEXT NOT NULL,
      url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE
    )
  `);

  // Crear índices para optimizar consultas
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);
    CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(published_at);
    CREATE INDEX IF NOT EXISTS idx_blogs_featured ON blogs(featured);
    CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
  `);

  console.log('Base de datos inicializada correctamente');
}

// Funciones para manejo de blogs
export const blogQueries = {
  // Insertar nuevo blog
  insertBlog: db.prepare(`
    INSERT INTO blogs (title, slug, excerpt, content, category, author, published_at, read_time, image, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  // Obtener todos los blogs con paginación
  getAllBlogs: db.prepare(`
    SELECT * FROM blogs 
    ORDER BY published_at DESC, created_at DESC 
    LIMIT ? OFFSET ?
  `),

  // Obtener blogs por categoría
  getBlogsByCategory: db.prepare(`
    SELECT * FROM blogs 
    WHERE category = ? 
    ORDER BY published_at DESC, created_at DESC 
    LIMIT ? OFFSET ?
  `),

  // Obtener blog por slug
  getBlogBySlug: db.prepare(`
    SELECT * FROM blogs WHERE slug = ?
  `),

  // Obtener blogs destacados
  getFeaturedBlogs: db.prepare(`
    SELECT * FROM blogs 
    WHERE featured = 1 
    ORDER BY published_at DESC 
    LIMIT ?
  `),

  // Buscar blogs por texto
  searchBlogs: db.prepare(`
    SELECT * FROM blogs 
    WHERE title LIKE ? OR excerpt LIKE ? OR content LIKE ?
    ORDER BY published_at DESC 
    LIMIT ? OFFSET ?
  `),

  // Contar total de blogs
  countBlogs: db.prepare(`SELECT COUNT(*) as count FROM blogs`),

  // Contar blogs por categoría
  countBlogsByCategory: db.prepare(`
    SELECT COUNT(*) as count FROM blogs WHERE category = ?
  `),

  // Actualizar blog
  updateBlog: db.prepare(`
    UPDATE blogs 
    SET title = ?, excerpt = ?, content = ?, category = ?, author = ?, 
        read_time = ?, image = ?, featured = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  // Eliminar blog
  deleteBlog: db.prepare(`DELETE FROM blogs WHERE id = ?`)
};

// Funciones para manejo de tags
export const tagQueries = {
  // Insertar tag si no existe
  insertTag: db.prepare(`
    INSERT OR IGNORE INTO tags (name) VALUES (?)
  `),

  // Obtener tag por nombre
  getTagByName: db.prepare(`
    SELECT * FROM tags WHERE name = ?
  `),

  // Obtener todos los tags
  getAllTags: db.prepare(`
    SELECT t.*, COUNT(bt.blog_id) as blog_count 
    FROM tags t 
    LEFT JOIN blog_tags bt ON t.id = bt.tag_id 
    GROUP BY t.id 
    ORDER BY blog_count DESC, t.name
  `),

  // Asociar tag con blog
  addTagToBlog: db.prepare(`
    INSERT OR IGNORE INTO blog_tags (blog_id, tag_id) VALUES (?, ?)
  `),

  // Obtener tags de un blog
  getTagsForBlog: db.prepare(`
    SELECT t.* FROM tags t
    JOIN blog_tags bt ON t.id = bt.tag_id
    WHERE bt.blog_id = ?
    ORDER BY t.name
  `),

  // Eliminar tags de un blog
  removeTagsFromBlog: db.prepare(`
    DELETE FROM blog_tags WHERE blog_id = ?
  `)
};

// Funciones para manejo de citas
export const citationQueries = {
  // Insertar cita
  insertCitation: db.prepare(`
    INSERT INTO citations (blog_id, text, source, url) VALUES (?, ?, ?, ?)
  `),

  // Obtener citas de un blog
  getCitationsForBlog: db.prepare(`
    SELECT * FROM citations WHERE blog_id = ? ORDER BY id
  `),

  // Eliminar citas de un blog
  removeCitationsFromBlog: db.prepare(`
    DELETE FROM citations WHERE blog_id = ?
  `)
};

// Función para crear un blog completo con tags y citas
export function createCompleteBlog(blogData, tags, citations) {
  const transaction = db.transaction(() => {
    // 1. Insertar blog
    const blogResult = blogQueries.insertBlog.run(
      blogData.title,
      blogData.slug,
      blogData.excerpt,
      blogData.content,
      blogData.category,
      blogData.author,
      blogData.publishedAt,
      blogData.readTime,
      blogData.image,
      blogData.featured ? 1 : 0
    );

    const blogId = blogResult.lastInsertRowid;

    // 2. Insertar y asociar tags
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        // Insertar tag si no existe
        tagQueries.insertTag.run(tagName);
        
        // Obtener ID del tag
        const tag = tagQueries.getTagByName.run(tagName);
        
        // Asociar tag con blog
        if (tag) {
          tagQueries.addTagToBlog.run(blogId, tag.id);
        }
      }
    }

    // 3. Insertar citas
    if (citations && citations.length > 0) {
      for (const citation of citations) {
        citationQueries.insertCitation.run(
          blogId,
          citation.text,
          citation.source,
          citation.url || null
        );
      }
    }

    return blogId;
  });

  return transaction();
}

// Función para obtener blog completo con tags y citas
export function getCompleteBlog(slug) {
  const blog = blogQueries.getBlogBySlug.run(slug);
  
  if (!blog) return null;

  // Obtener tags
  const tags = tagQueries.getTagsForBlog.all(blog.id);
  
  // Obtener citas
  const citations = citationQueries.getCitationsForBlog.all(blog.id);

  return {
    ...blog,
    tags: tags.map(tag => tag.name),
    citations: citations.map(citation => ({
      text: citation.text,
      source: citation.source,
      url: citation.url
    })),
    featured: Boolean(blog.featured)
  };
}

// Función para obtener blogs con sus tags (para listado)
export function getBlogsWithTags(category = null, limit = 10, offset = 0) {
  let blogs;
  
  if (category) {
    blogs = blogQueries.getBlogsByCategory.all(category, limit, offset);
  } else {
    blogs = blogQueries.getAllBlogs.all(limit, offset);
  }

  // Obtener tags para cada blog
  return blogs.map(blog => {
    const tags = tagQueries.getTagsForBlog.all(blog.id);
    return {
      ...blog,
      tags: tags.map(tag => tag.name),
      featured: Boolean(blog.featured)
    };
  });
}

// Inicializar base de datos al importar
try {
  initializeDatabase();
} catch (error) {
  console.error('Error inicializando base de datos:', error);
}

// Configurar cierre correcto de la base de datos
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));

export default db;