// api/blogs/index.js
// Endpoint simplificado que redirige al sistema de gestión unificado

export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ 
      message: 'Método no permitido. Use /api/blogs/manage para operaciones CRUD' 
    });
  }

  // Redirigir al endpoint de gestión unificada
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const queryString = new URLSearchParams(req.query).toString();
    const redirectUrl = `${protocol}://${host}/api/blogs/manage${queryString ? '?' + queryString : ''}`;
    
    const response = await fetch(redirectUrl);
    const data = await response.json();
    
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Error redirigiendo a gestión:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error accediendo al sistema de blogs',
      error: error.message,
      redirect: '/api/blogs/manage'
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
        blog: {
          id: blog.id,
          title: blog.title,
          slug: blog.slug,
          excerpt: blog.excerpt,
          content: blog.content,
          category: blog.category,
          author: blog.author,
          publishedAt: blog.published_at,
          readTime: blog.read_time,
          image: blog.image || `/images/blog/${blog.category}/default.jpg`,
          featured: Boolean(blog.featured),
          tags: blog.tags || [],
          citations: blog.citations || []
        }
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
      // Para el conteo, haremos una query separada en producción
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
      image: blog.image || `/images/blog/${blog.category}/default.jpg`,
      featured: Boolean(blog.featured),
      tags: blog.tags ? blog.tags.split(',').filter(Boolean) : []
    }));

    // Calcular paginación
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

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
      endpoint: '/api/blogs'
    });

  } catch (error) {
    console.error('Error obteniendo blogs:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error obteniendo blogs de la base de datos',
      error: {
        message: error.message,
        name: error.name
      },
      endpoint: '/api/blogs'
    });
  }
}