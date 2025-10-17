// api/blogs/static.js
// Endpoint para blogs usando datos estáticos sin base de datos

import { blogPosts } from '../../src/data/blogs.js';

export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Método no permitido. Use GET.',
      endpoint: '/api/blogs/static'
    });
  }

  try {
    const { 
      category, 
      page = 1, 
      limit = 10, 
      search, 
      featured,
      slug 
    } = req.query;

    // Si se solicita un blog específico por slug
    if (slug) {
      const blog = blogPosts.find(b => b.slug === slug);
      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog no encontrado'
        });
      }
      return res.status(200).json({
        success: true,
        blog: {
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
          tags: blog.tags,
          citations: blog.citations || []
        }
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let filteredBlogs = [...blogPosts];

    // Filtrar por categoría
    if (category && ['medico-estetico', 'tecnico'].includes(category)) {
      filteredBlogs = filteredBlogs.filter(blog => blog.category === category);
    }

    // Filtrar por featured
    if (featured === 'true') {
      filteredBlogs = filteredBlogs.filter(blog => blog.featured);
    }

    // Filtrar por búsqueda
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredBlogs = filteredBlogs.filter(blog => 
        blog.title.toLowerCase().includes(searchTerm) ||
        blog.excerpt.toLowerCase().includes(searchTerm) ||
        blog.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Ordenar por fecha (más recientes primero)
    filteredBlogs.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Calcular paginación
    const totalCount = filteredBlogs.length;
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    // Aplicar paginación
    const blogs = filteredBlogs.slice(offset, offset + limitNum);

    // Formatear respuesta
    const formattedBlogs = blogs.map(blog => ({
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      category: blog.category,
      author: blog.author,
      publishedAt: blog.publishedAt,
      readTime: blog.readTime,
      image: blog.image,
      featured: blog.featured,
      tags: blog.tags
    }));

    res.status(200).json({
      success: true,
      blogs: formattedBlogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages,
        hasNext,
        hasPrev
      },
      filters: {
        category: category || null,
        search: search || null,
        featured: featured === 'true'
      },
      endpoint: '/api/blogs/static'
    });

  } catch (error) {
    console.error('Error en blogs estáticos:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error cargando blogs',
      error: {
        message: error.message,
        name: error.name
      },
      endpoint: '/api/blogs/static'
    });
  }
}