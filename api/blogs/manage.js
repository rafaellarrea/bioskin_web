// api/blogs/manage.js
// Endpoint unificado para gestión completa de blogs (CRUD + JSON storage)

// import { blogPosts } from '../../src/data/blogs.ts';

// Datos estáticos de blogs (cargados manualmente para evitar problemas TS/JS)
const blogPosts = [
  {
    id: "1",
    title: "Beneficios del Ácido Hialurónico en Tratamientos Faciales",
    slug: "beneficios-acido-hialuronico-tratamientos-faciales",
    excerpt: "Descubre cómo el ácido hialurónico puede transformar tu piel y los diferentes tipos de tratamientos disponibles en medicina estética.",
    content: `# Beneficios del Ácido Hialurónico en Tratamientos Faciales

El ácido hialurónico es una de las sustancias más revolucionarias en el mundo de la medicina estética moderna. Esta molécula natural, presente en nuestro cuerpo, ha demostrado ser fundamental para mantener la hidratación y elasticidad de la piel.

## ¿Qué es el Ácido Hialurónico?

El ácido hialurónico es una sustancia naturalmente presente en nuestro organismo, especialmente en la piel, articulaciones y ojos. Su principal característica es su capacidad de retener hasta 1000 veces su peso en agua.

## Beneficios Principales

### 1. Hidratación Profunda
La aplicación de ácido hialurónico proporciona una hidratación inmediata y duradera, mejorando la textura y apariencia de la piel.

### 2. Reducción de Arrugas
Los tratamientos con ácido hialurónico ayudan a suavizar líneas finas y arrugas, proporcionando un aspecto más juvenil.

### 3. Volumen Natural
Permite restaurar volúmenes perdidos de forma natural, especialmente en pómulos y labios.

## Conclusión
El ácido hialurónico representa una excelente opción para quienes buscan mejorar la apariencia de su piel de manera segura y efectiva.`,
    category: 'medico-estetico',
    author: 'Dr. BIOSKIN',
    publishedAt: '2024-01-15T10:00:00.000Z',
    readTime: 8,
    tags: ['ácido hialurónico', 'hidratación', 'anti-aging'],
    image: '/images/services/hidratacionProfunda/antes-despues-1.jpg',
    featured: true,
    source: 'static'
  },
  {
    id: "2", 
    title: "Tecnología IPL: Revolución en Tratamientos de Fotorrejuvenecimiento",
    slug: "tecnologia-ipl-revolucion-fotorrejuvenecimiento",
    excerpt: "Explora cómo la tecnología de Luz Pulsada Intensa (IPL) está transformando los tratamientos de rejuvenecimiento facial.",
    content: `# Tecnología IPL: Revolución en Tratamientos de Fotorrejuvenecimiento

La tecnología de Luz Pulsada Intensa (IPL) representa uno de los avances más significativos en medicina estética no invasiva.

## ¿Qué es el IPL?

El IPL utiliza pulsos de luz de amplio espectro para tratar diversas condiciones de la piel de manera segura y eficaz.

## Aplicaciones Principales

### 1. Tratamiento de Manchas
Efectivo para reducir hiperpigmentación y manchas solares.

### 2. Rejuvenecimiento Facial
Estimula la producción de colágeno para una piel más firme.

### 3. Reducción de Rojeces
Trata rosácea y capilares dilatados.

## Conclusión
El IPL ofrece resultados excepcionales con mínimo tiempo de recuperación.`,
    category: 'tecnico',
    author: 'BIOSKIN Técnico',
    publishedAt: '2024-01-20T14:30:00.000Z',
    readTime: 6,
    tags: ['IPL', 'fotorrejuvenecimiento', 'tecnología'],
    image: '/images/productos/dispositivos/ipl/equipo-principal.jpg',
    featured: false,
    source: 'static'
  }
];
import { 
  getDynamicBlogs, 
  addDynamicBlog, 
  updateDynamicBlog, 
  deleteDynamicBlog, 
  findDynamicBlog,
  getDynamicBlogsCount
} from '../../lib/dynamic-blogs-storage.js';

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
    const dynamicBlogs = getDynamicBlogs();
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
      dynamic: getDynamicBlogsCount(),
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
  const dynamicBlogs = getDynamicBlogs();
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

  // Agregar usando el módulo de almacenamiento compartido
  const saved = addDynamicBlog(newBlog);

  return res.status(201).json({
    success: true,
    message: 'Blog creado exitosamente',
    blog: formatBlog(newBlog),
    storage: {
      memory: true,
      json: saved.json,
      location: saved.json ? 'json-file' : 'memory-only'
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

  // Buscar blog en dinámicos
  const dynamicBlogs = getDynamicBlogs();
  const existingBlog = dynamicBlogs.find(b => 
    (id && b.id === id) || (slug && b.slug === slug)
  );

  if (!existingBlog) {
    return res.status(404).json({
      success: false,
      message: 'Blog no encontrado o no editable (solo blogs generados dinámicamente)'
    });
  }

  // Actualizar blog
  const updatedBlog = {
    ...existingBlog,
    ...blog,
    updatedAt: new Date().toISOString()
  };

  // Actualizar usando el módulo de almacenamiento
  const saved = updateDynamicBlog(existingBlog.id, updatedBlog);

  return res.status(200).json({
    success: true,
    message: 'Blog actualizado exitosamente',
    blog: formatBlog(updatedBlog),
    storage: {
      memory: true,
      json: saved.json
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
  const dynamicBlogs = getDynamicBlogs();
  const blogToDelete = dynamicBlogs.find(b => 
    (id && b.id === id) || (slug && b.slug === slug)
  );

  if (!blogToDelete) {
    return res.status(404).json({
      success: false,
      message: 'Blog no encontrado o no eliminable (solo blogs generados dinámicamente)'
    });
  }

  // Eliminar blog usando el módulo de almacenamiento
  const saved = deleteDynamicBlog(blogToDelete.id);

  return res.status(200).json({
    success: true,
    message: 'Blog eliminado exitosamente',
    blog: formatBlog(blogToDelete),
    storage: {
      memory: true,
      json: saved.json
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