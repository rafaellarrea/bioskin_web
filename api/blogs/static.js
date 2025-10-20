// api/blogs/static.js
// Endpoint para blogs usando datos estáticos + blogs generados dinámicamente

// Datos estáticos de blogs (fallback temporal)
const blogPosts = [
  {
    id: "acido-hialuronico-facial",
    title: "Beneficios del Ácido Hialurónico en Tratamientos Faciales", 
    slug: "acido-hialuronico-facial",
    excerpt: "Descubre cómo el ácido hialurónico puede transformar tu piel y los diferentes tipos de tratamientos disponibles en medicina estética.",
    content: "El ácido hialurónico es una sustancia...",
    category: "medico-estetico",
    author: "Dra. Daniela Creamer",
    publishedAt: "2024-10-09",
    readTime: 5,
    image: "/images/blog/medico-estetico/acido-hialuronico.jpg",
    featured: true,
    tags: ["ácido hialurónico", "hidratación", "anti-aging"]
  },
  {
    id: "tecnologia-ipl",
    title: "Tecnología IPL: Fundamentos y Aplicaciones Clínicas",
    slug: "tecnologia-ipl", 
    excerpt: "Análisis técnico de la tecnología de Luz Pulsada Intensa (IPL) y sus múltiples aplicaciones en medicina estética.",
    content: "La tecnología IPL representa...",
    category: "tecnico",
    author: "Equipo Técnico BIOSKIN",
    publishedAt: "2024-10-07",
    readTime: 8,
    image: "/images/blog/tecnico/ipl-technology.jpg",
    featured: false,
    tags: ["IPL", "fototermólisis", "tecnología médica"]
  }
];

// Importar funciones de almacenamiento compartido
import { 
  getDynamicBlogs, 
  addDynamicBlog
} from '../../lib/dynamic-blogs-storage.js';

export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Manejar POST para agregar blogs dinámicos
  if (req.method === 'POST') {
    try {
      const { blog } = req.body;
      if (blog) {
        // Formatear blog para compatibilidad con datos estáticos
        const formattedBlog = {
          id: blog.slug || Date.now().toString(),
          title: blog.title,
          slug: blog.slug,
          excerpt: blog.excerpt,
          content: blog.content || blog.excerpt,
          category: blog.category,
          author: blog.author || 'BIOSKIN IA',
          publishedAt: blog.published_at || new Date().toISOString().split('T')[0],
          readTime: blog.read_time || 5,
          tags: blog.tags || [],
          image: `/images/blog/${blog.category}/default.jpg`,
          featured: false
        };

        // Agregar usando el módulo de almacenamiento compartido
        addDynamicBlog(formattedBlog);

        return res.status(200).json({
          success: true,
          message: 'Blog agregado dinámicamente',
          blogId: formattedBlog.id
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Error agregando blog dinámico',
        error: error.message
      });
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Método no permitido. Use GET o POST.',
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
      // Buscar primero en blogs dinámicos, luego en estáticos
      const dynamicBlogs = getDynamicBlogs();
      let blog = dynamicBlogs.find(b => b.slug === slug);
      if (!blog) {
        blog = blogPosts.find(b => b.slug === slug);
      }
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

    // Combinar blogs estáticos + dinámicos
    const dynamicBlogs = getDynamicBlogs();
    let filteredBlogs = [...dynamicBlogs, ...blogPosts];

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