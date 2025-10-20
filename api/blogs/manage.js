// api/blogs/manage.js
// Endpoint unificado para gestión completa de blogs (CRUD + JSON storage)

import { blogPosts } from '../../src/data/blogs.js';
import { createWriteStream, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ruta para almacenamiento JSON local (solo para desarrollo)
const BLOGS_JSON_PATH = join(__dirname, '../../data/blogs-generated.json');

// Array para almacenar blogs dinámicamente en memoria (producción)
let dynamicBlogs = [];

// Función para leer blogs JSON existentes
function loadBlogsFromJSON() {
  if (typeof window !== 'undefined') return []; // Browser environment
  
  try {
    if (existsSync(BLOGS_JSON_PATH)) {
      const data = readFileSync(BLOGS_JSON_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Error leyendo blogs JSON:', error.message);
  }
  return [];
}

// Función para guardar blogs en JSON (solo desarrollo local)
function saveBlogsToJSON(blogs) {
  if (typeof window !== 'undefined' || process.env.VERCEL) return false; // Skip en browser y Vercel
  
  try {
    const dataDir = dirname(BLOGS_JSON_PATH);
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    
    writeFileSync(BLOGS_JSON_PATH, JSON.stringify(blogs, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.warn('Error guardando blogs JSON:', error.message);
    return false;
  }
}

// Inicializar blogs dinámicos al importar
if (dynamicBlogs.length === 0) {
  const savedBlogs = loadBlogsFromJSON();
  dynamicBlogs.push(...savedBlogs);
}

export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;
  const { action, id, slug } = req.query;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ 
          success: false,
          message: `Método ${method} no permitido`,
          endpoint: '/api/blogs/manage'
        });
    }
  } catch (error) {
    console.error('Error en gestión de blogs:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
      endpoint: '/api/blogs/manage'
    });
  }
}

// GET: Obtener blogs (lista o individual)
async function handleGet(req, res) {
  const { 
    category, 
    page = 1, 
    limit = 10, 
    search, 
    featured,
    slug,
    source = 'all' // 'static', 'dynamic', 'all'
  } = req.query;

  // Combinar blogs según source
  let allBlogs = [];
  if (source === 'static' || source === 'all') {
    allBlogs.push(...blogPosts.map(blog => ({ ...blog, source: 'static' })));
  }
  if (source === 'dynamic' || source === 'all') {
    allBlogs.push(...dynamicBlogs.map(blog => ({ ...blog, source: 'dynamic' })));
  }

  // Si se solicita un blog específico por slug
  if (slug) {
    const blog = allBlogs.find(b => b.slug === slug);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog no encontrado'
      });
    }
    return res.status(200).json({
      success: true,
      blog: formatBlog(blog)
    });
  }

  // Aplicar filtros
  let filteredBlogs = allBlogs;

  if (category && ['medico-estetico', 'tecnico'].includes(category)) {
    filteredBlogs = filteredBlogs.filter(blog => blog.category === category);
  }

  if (featured === 'true') {
    filteredBlogs = filteredBlogs.filter(blog => blog.featured);
  }

  if (search) {
    const searchTerm = search.toLowerCase();
    filteredBlogs = filteredBlogs.filter(blog => 
      blog.title.toLowerCase().includes(searchTerm) ||
      blog.excerpt.toLowerCase().includes(searchTerm) ||
      (blog.tags && blog.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
  }

  // Ordenar por fecha (más recientes primero)
  filteredBlogs.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // Paginación
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  const totalCount = filteredBlogs.length;
  const totalPages = Math.ceil(totalCount / limitNum);
  const blogs = filteredBlogs.slice(offset, offset + limitNum);

  return res.status(200).json({
    success: true,
    blogs: blogs.map(formatBlog),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    },
    stats: {
      static: blogPosts.length,
      dynamic: dynamicBlogs.length,
      total: allBlogs.length
    },
    endpoint: '/api/blogs/manage'
  });
}

// POST: Crear nuevo blog
async function handlePost(req, res) {
  const { blog } = req.body;

  if (!blog || !blog.title || !blog.slug) {
    return res.status(400).json({
      success: false,
      message: 'Datos del blog incompletos (title y slug requeridos)'
    });
  }

  // Verificar que no existe un blog con el mismo slug
  const allBlogs = [...blogPosts, ...dynamicBlogs];
  if (allBlogs.find(b => b.slug === blog.slug)) {
    return res.status(400).json({
      success: false,
      message: 'Ya existe un blog con ese slug'
    });
  }

  // Formatear blog
  const newBlog = {
    id: blog.id || Date.now().toString(),
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt || blog.title,
    content: blog.content || blog.excerpt || '',
    category: blog.category || 'medico-estetico',
    author: blog.author || 'BIOSKIN IA',
    publishedAt: blog.publishedAt || new Date().toISOString().split('T')[0],
    readTime: blog.readTime || blog.read_time || 5,
    tags: blog.tags || [],
    image: blog.image || `/images/blog/${blog.category || 'medico-estetico'}/default.jpg`,
    featured: Boolean(blog.featured),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Agregar al array dinámico
  dynamicBlogs.unshift(newBlog);

  // Intentar guardar en JSON (solo desarrollo local)
  const saved = saveBlogsToJSON(dynamicBlogs);

  return res.status(201).json({
    success: true,
    message: 'Blog creado exitosamente',
    blog: formatBlog(newBlog),
    storage: {
      memory: true,
      json: saved,
      location: saved ? BLOGS_JSON_PATH : 'memory-only'
    },
    endpoint: '/api/blogs/manage'
  });
}

// PUT: Actualizar blog existente
async function handlePut(req, res) {
  const { blog } = req.body;
  const { id, slug } = req.query;

  if (!blog || (!id && !slug)) {
    return res.status(400).json({
      success: false,
      message: 'ID o slug del blog requerido'
    });
  }

  // Buscar blog en dinámicos (solo se pueden editar los generados dinámicamente)
  const blogIndex = dynamicBlogs.findIndex(b => 
    (id && b.id === id) || (slug && b.slug === slug)
  );

  if (blogIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Blog no encontrado o no editable (solo blogs generados dinámicamente)'
    });
  }

  // Actualizar blog
  const updatedBlog = {
    ...dynamicBlogs[blogIndex],
    ...blog,
    updatedAt: new Date().toISOString()
  };

  dynamicBlogs[blogIndex] = updatedBlog;

  // Intentar guardar en JSON
  const saved = saveBlogsToJSON(dynamicBlogs);

  return res.status(200).json({
    success: true,
    message: 'Blog actualizado exitosamente',
    blog: formatBlog(updatedBlog),
    storage: {
      memory: true,
      json: saved
    },
    endpoint: '/api/blogs/manage'
  });
}

// DELETE: Eliminar blog
async function handleDelete(req, res) {
  const { id, slug } = req.query;

  if (!id && !slug) {
    return res.status(400).json({
      success: false,
      message: 'ID o slug del blog requerido'
    });
  }

  // Buscar blog en dinámicos
  const blogIndex = dynamicBlogs.findIndex(b => 
    (id && b.id === id) || (slug && b.slug === slug)
  );

  if (blogIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Blog no encontrado o no eliminable (solo blogs generados dinámicamente)'
    });
  }

  // Eliminar blog
  const deletedBlog = dynamicBlogs.splice(blogIndex, 1)[0];

  // Guardar cambios en JSON
  const saved = saveBlogsToJSON(dynamicBlogs);

  return res.status(200).json({
    success: true,
    message: 'Blog eliminado exitosamente',
    blog: formatBlog(deletedBlog),
    storage: {
      memory: true,
      json: saved
    },
    endpoint: '/api/blogs/manage'
  });
}

// Función helper para formatear blog
function formatBlog(blog) {
  return {
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    content: blog.content,
    category: blog.category,
    author: blog.author,
    publishedAt: blog.publishedAt,
    readTime: blog.readTime,
    image: blog.image,
    featured: blog.featured,
    tags: blog.tags || [],
    source: blog.source || 'unknown',
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt
  };
}