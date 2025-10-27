// api/blogs/organized.js - Endpoint para blogs organizados en Vercel
const fs = require('fs-extra');
const path = require('path');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { method, query } = req;
    const { action, slug, category, featured, search } = query;

    console.log('🔄 Blogs organizados - Método:', method, 'Acción:', action);

    if (method === 'GET') {
      switch (action) {
        case 'all':
          return await getAllBlogs(res);
        
        case 'bySlug':
          if (!slug) {
            return res.status(400).json({ success: false, error: 'Slug requerido' });
          }
          return await getBlogBySlug(res, slug);
        
        case 'byCategory':
          if (!category) {
            return res.status(400).json({ success: false, error: 'Categoría requerida' });
          }
          return await getBlogsByCategory(res, category);
        
        case 'featured':
          return await getFeaturedBlogs(res);
        
        case 'search':
          if (!search) {
            return res.status(400).json({ success: false, error: 'Término de búsqueda requerido' });
          }
          return await searchBlogs(res, search);
        
        case 'stats':
          return await getBlogStats(res);
        
        default:
          // Si no se especifica acción, devolver todos los blogs
          return await getAllBlogs(res);
      }
    }

    // Método no permitido
    res.status(405).json({
      success: false,
      error: 'Método no permitido'
    });

  } catch (error) {
    console.error('❌ Error en endpoint de blogs organizados:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}

async function getAllBlogs(res) {
  try {
    const blogsDir = path.join(process.cwd(), 'src/data/blogs');
    const indexPath = path.join(blogsDir, 'index.json');
    
    if (await fs.pathExists(indexPath)) {
      const indexContent = await fs.readFile(indexPath, 'utf8');
      const indexData = JSON.parse(indexContent);
      
      // Transformar para el frontend
      const webBlogs = indexData.blogs.map(blog => ({
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        content: blog.content,
        category: blog.category,
        author: blog.author,
        publishedAt: blog.publishedAt,
        readTime: blog.readTime,
        tags: blog.tags,
        image: blog.image || blog.imagenPrincipal,
        imagenPrincipal: blog.imagenPrincipal,
        imagenConclusion: blog.imagenConclusion,
        featured: blog.featured || false,
        source: blog.source || 'unknown',
        structure: blog.structure || 'legacy'
      }));

      res.json({
        success: true,
        blogs: webBlogs,
        metadata: {
          total: indexData.total,
          organized: indexData.organized,
          legacy: indexData.legacy,
          lastUpdated: indexData.lastUpdated
        }
      });
    } else {
      // Si no existe índice, devolver blogs legacy
      const legacyBlogs = await getLegacyBlogs(blogsDir);
      res.json({
        success: true,
        blogs: legacyBlogs,
        metadata: {
          total: legacyBlogs.length,
          organized: 0,
          legacy: legacyBlogs.length,
          lastUpdated: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Error obteniendo todos los blogs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function getBlogBySlug(res, slug) {
  try {
    const blogsDir = path.join(process.cwd(), 'src/data/blogs');
    
    // Buscar en estructura organizada
    const organizedPath = path.join(blogsDir, slug, 'index.json');
    if (await fs.pathExists(organizedPath)) {
      const content = await fs.readFile(organizedPath, 'utf8');
      const blogData = JSON.parse(content);
      
      return res.json({
        success: true,
        blog: transformBlogForWeb(blogData),
        structure: 'organized'
      });
    }
    
    // Buscar en archivos legacy
    const legacyPath = path.join(blogsDir, `${slug}.json`);
    if (await fs.pathExists(legacyPath)) {
      const content = await fs.readFile(legacyPath, 'utf8');
      const blogData = JSON.parse(content);
      
      return res.json({
        success: true,
        blog: transformBlogForWeb(blogData),
        structure: 'legacy'
      });
    }
    
    res.status(404).json({
      success: false,
      error: 'Blog no encontrado'
    });
    
  } catch (error) {
    console.error(`Error obteniendo blog ${slug}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function getBlogsByCategory(res, category) {
  try {
    const allBlogsResponse = await getAllBlogsData();
    const filteredBlogs = allBlogsResponse.blogs.filter(blog => 
      blog.category === category
    );
    
    res.json({
      success: true,
      blogs: filteredBlogs,
      category: category,
      total: filteredBlogs.length
    });
  } catch (error) {
    console.error(`Error obteniendo blogs por categoría ${category}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function getFeaturedBlogs(res) {
  try {
    const allBlogsResponse = await getAllBlogsData();
    const featuredBlogs = allBlogsResponse.blogs.filter(blog => 
      blog.featured === true
    );
    
    res.json({
      success: true,
      blogs: featuredBlogs,
      total: featuredBlogs.length
    });
  } catch (error) {
    console.error('Error obteniendo blogs destacados:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function searchBlogs(res, searchTerm) {
  try {
    const allBlogsResponse = await getAllBlogsData();
    const term = searchTerm.toLowerCase();
    
    const searchResults = allBlogsResponse.blogs.filter(blog => 
      blog.title.toLowerCase().includes(term) ||
      blog.excerpt.toLowerCase().includes(term) ||
      blog.content.toLowerCase().includes(term) ||
      blog.tags.some(tag => tag.toLowerCase().includes(term))
    );
    
    res.json({
      success: true,
      blogs: searchResults,
      searchTerm: searchTerm,
      total: searchResults.length
    });
  } catch (error) {
    console.error(`Error buscando blogs con término ${searchTerm}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function getBlogStats(res) {
  try {
    const allBlogsResponse = await getAllBlogsData();
    const blogs = allBlogsResponse.blogs;
    
    const stats = {
      total: blogs.length,
      organized: blogs.filter(b => b.structure === 'organized').length,
      legacy: blogs.filter(b => b.structure === 'legacy').length,
      categories: {},
      totalImages: 0,
      lastUpdated: allBlogsResponse.metadata.lastUpdated
    };

    // Contar por categorías
    blogs.forEach(blog => {
      if (stats.categories[blog.category]) {
        stats.categories[blog.category]++;
      } else {
        stats.categories[blog.category] = 1;
      }

      // Contar imágenes
      if (blog.images && Array.isArray(blog.images)) {
        stats.totalImages += blog.images.length;
      }
    });

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Funciones auxiliares
async function getAllBlogsData() {
  const blogsDir = path.join(process.cwd(), 'src/data/blogs');
  const indexPath = path.join(blogsDir, 'index.json');
  
  if (await fs.pathExists(indexPath)) {
    const indexContent = await fs.readFile(indexPath, 'utf8');
    const indexData = JSON.parse(indexContent);
    
    const webBlogs = indexData.blogs.map(transformBlogForWeb);
    
    return {
      blogs: webBlogs,
      metadata: {
        total: indexData.total,
        organized: indexData.organized,
        legacy: indexData.legacy,
        lastUpdated: indexData.lastUpdated
      }
    };
  } else {
    const legacyBlogs = await getLegacyBlogs(blogsDir);
    return {
      blogs: legacyBlogs,
      metadata: {
        total: legacyBlogs.length,
        organized: 0,
        legacy: legacyBlogs.length,
        lastUpdated: new Date().toISOString()
      }
    };
  }
}

async function getLegacyBlogs(blogsDir) {
  const blogs = [];
  
  if (await fs.pathExists(blogsDir)) {
    const files = await fs.readdir(blogsDir);
    
    for (const file of files) {
      if (file.endsWith('.json') && file !== 'index.json') {
        try {
          const filePath = path.join(blogsDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const blogData = JSON.parse(content);
          blogs.push(transformBlogForWeb({
            ...blogData,
            structure: 'legacy',
            source: blogData.source || 'legacy'
          }));
        } catch (err) {
          console.warn(`⚠️ Error leyendo blog legacy ${file}:`, err.message);
        }
      }
    }
  }
  
  return blogs.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

function transformBlogForWeb(blog) {
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
    tags: blog.tags,
    image: blog.image || blog.imagenPrincipal,
    imagenPrincipal: blog.imagenPrincipal,
    imagenConclusion: blog.imagenConclusion,
    featured: blog.featured || false,
    source: blog.source || 'unknown',
    structure: blog.structure || 'legacy'
  };
}