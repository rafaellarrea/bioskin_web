// api/blogs/index.js

import { getBlogsWithTags, getCompleteBlog, blogQueries } from '../../lib/database.js';

export default async function handler(req, res) {
  const { method, query } = req;

  try {
    switch (method) {
      case 'GET':
        return handleGetBlogs(req, res);
      default:
        res.setHeader('Allow', ['GET']);
        res.status(405).json({ message: `Método ${method} no permitido` });
    }
  } catch (error) {
    console.error('Error en API de blogs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
}

async function handleGetBlogs(req, res) {
  const { 
    category, 
    page = 1, 
    limit = 10, 
    search, 
    featured,
    slug 
  } = req.query;

  try {
    // Si se solicita un blog específico por slug
    if (slug) {
      const blog = getCompleteBlog(slug);
      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog no encontrado'
        });
      }
      return res.status(200).json({
        success: true,
        blog: blog
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let blogs = [];
    let totalCount = 0;

    // Obtener blogs destacados
    if (featured === 'true') {
      blogs = blogQueries.getFeaturedBlogs.all(limitNum);
      totalCount = blogs.length;
    }
    // Búsqueda por texto
    else if (search) {
      const searchTerm = `%${search}%`;
      blogs = blogQueries.searchBlogs.all(searchTerm, searchTerm, searchTerm, limitNum, offset);
      // Para el conteo, haríamos una query separada en producción
      totalCount = blogs.length;
    }
    // Filtrar por categoría
    else if (category && ['medico-estetico', 'tecnico'].includes(category)) {
      blogs = getBlogsWithTags(category, limitNum, offset);
      const countResult = blogQueries.countBlogsByCategory.get(category);
      totalCount = countResult?.count || 0;
    }
    // Obtener todos los blogs
    else {
      blogs = getBlogsWithTags(null, limitNum, offset);
      const countResult = blogQueries.countBlogs.get();
      totalCount = countResult?.count || 0;
    }

    // Formatear respuesta
    const formattedBlogs = blogs.map(blog => ({
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      category: blog.category,
      author: blog.author,
      publishedAt: blog.published_at,
      readTime: blog.read_time,
      image: blog.image,
      featured: blog.featured,
      tags: blog.tags || []
    }));

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      blogs: formattedBlogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      },
      filters: {
        category: category || null,
        search: search || null,
        featured: featured === 'true'
      }
    });

  } catch (error) {
    console.error('Error obteniendo blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo blogs',
      error: error.message
    });
  }
}