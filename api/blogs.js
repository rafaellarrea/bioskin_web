// Función consolidada para todas las operaciones de blogs
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;
  const { action } = req.body || req.query;

  // Validar que se proporcione una acción
  if (!action) {
    return res.status(400).json({
      success: false,
      message: 'Acción requerida. Acciones disponibles: json-files, manage, migrate-all, organized'
    });
  }

  try {
    switch (action) {
      // Obtener archivos JSON de blogs
      case 'getJsonFiles':
        return await getJsonFiles(req, res);
      
      // Gestionar blogs (CRUD)
      case 'manage':
        return await manageBlogs(req, res);
      
      // Operaciones organizadas de blogs
      case 'organized':
        return await organizedBlogs(req, res);

      default:
        return res.status(400).json({
          success: false,
          message: 'Acción no válida. Acciones disponibles: getJsonFiles, manage, organized'
        });
    }
  } catch (error) {
    console.error('❌ Error en operación de blogs:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}

// Función para obtener blogs desde el sistema organizado (lee index.json + carpetas)
async function getJsonFiles(req, res) {
  try {
    const blogsDir = path.join(process.cwd(), 'src', 'data', 'blogs');
    
    try {
      await fs.access(blogsDir);
    } catch {
      return res.status(200).json({
        success: true,
        blogs: [],
        message: 'Directorio de blogs no existe aún'
      });
    }

    // 1. Intentar leer el index.json primero (sistema organizado)
    const indexPath = path.join(blogsDir, 'index.json');
    let indexBlogs = [];
    
    try {
      const indexContent = await fs.readFile(indexPath, 'utf8');
      const indexData = JSON.parse(indexContent);
      
      if (indexData.blogs && Array.isArray(indexData.blogs)) {
        // Cargar el contenido completo de cada blog desde su carpeta
        const blogsWithContent = await Promise.all(
          indexData.blogs.map(async (blogMeta) => {
            try {
              if (blogMeta.paths && blogMeta.paths.blog) {
                const blogPath = path.join(process.cwd(), blogMeta.paths.blog);
                const blogContent = await fs.readFile(blogPath, 'utf8');
                const fullBlog = JSON.parse(blogContent);
                
                return {
                  ...fullBlog,
                  id: blogMeta.id,
                  slug: blogMeta.slug,
                  source: 'organized-json',
                  images: blogMeta.images || [],
                  status: blogMeta.status || 'published'
                };
              }
              return null;
            } catch (error) {
              console.warn(`Error cargando blog ${blogMeta.slug}:`, error);
              return null;
            }
          })
        );
        
        indexBlogs = blogsWithContent.filter(blog => blog !== null);
      }
    } catch (indexError) {
      console.warn('No se pudo leer index.json:', indexError.message);
    }

    // 2. Fallback: buscar archivos JSON individuales en la raíz
    if (indexBlogs.length === 0) {
      const files = await fs.readdir(blogsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json') && file !== 'index.json');
      
      const directBlogs = await Promise.all(
        jsonFiles.map(async (file) => {
          try {
            const filePath = path.join(blogsDir, file);
            const content = await fs.readFile(filePath, 'utf8');
            const blogData = JSON.parse(content);
            
            return {
              ...blogData,
              source: 'direct-json',
              slug: blogData.slug || file.replace('.json', '')
            };
          } catch (error) {
            console.warn(`Error leyendo ${file}:`, error);
            return null;
          }
        })
      );
      
      indexBlogs = directBlogs.filter(blog => blog !== null);
    }

    return res.status(200).json({
      success: true,
      blogs: indexBlogs,
      total: indexBlogs.length,
      message: `${indexBlogs.length} blogs cargados desde sistema organizado`
    });
  } catch (error) {
    console.error('Error cargando blogs organizados:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}

// Función para gestionar blogs (original manage.js)
async function manageBlogs(req, res) {
  const { method } = req;
  const { operation } = req.body || req.query;

  switch (operation) {
    case 'list':
      return await listBlogs(req, res);
    
    case 'get':
      return await getBlog(req, res);
    
    case 'create':
      if (method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Método no permitido para crear' });
      }
      return await createBlog(req, res);
    
    case 'update':
      if (method !== 'PUT') {
        return res.status(405).json({ success: false, message: 'Método no permitido para actualizar' });
      }
      return await updateBlog(req, res);
    
    case 'delete':
      if (method !== 'DELETE') {
        return res.status(405).json({ success: false, message: 'Método no permitido para eliminar' });
      }
      return await deleteBlog(req, res);

    default:
      return res.status(400).json({
        success: false,
        message: 'Operación no válida. Operaciones disponibles: list, get, create, update, delete'
      });
  }
}

// Funciones auxiliares para gestión de blogs
async function listBlogs(req, res) {
  try {
    const blogsDir = path.join(process.cwd(), 'src', 'data', 'blogs');
    
    try {
      await fs.access(blogsDir);
    } catch {
      return res.status(200).json({
        success: true,
        blogs: [],
        message: 'No hay blogs disponibles'
      });
    }

    const files = await fs.readdir(blogsDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const blogs = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const filePath = path.join(blogsDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          return JSON.parse(content);
        } catch (error) {
          return null;
        }
      })
    );

    const validBlogs = blogs.filter(blog => blog !== null);

    return res.status(200).json({
      success: true,
      blogs: validBlogs,
      total: validBlogs.length
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error listando blogs',
      error: error.message
    });
  }
}

async function getBlog(req, res) {
  const { slug } = req.query;
  
  if (!slug) {
    return res.status(400).json({
      success: false,
      message: 'Slug requerido'
    });
  }

  try {
    const blogPath = path.join(process.cwd(), 'src', 'data', 'blogs', `${slug}.json`);
    const content = await fs.readFile(blogPath, 'utf8');
    const blog = JSON.parse(content);

    return res.status(200).json({
      success: true,
      blog: blog
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: 'Blog no encontrado'
    });
  }
}

async function createBlog(req, res) {
  const { blog } = req.body;
  
  if (!blog || !blog.slug) {
    return res.status(400).json({
      success: false,
      message: 'Datos de blog y slug requeridos'
    });
  }

  try {
    const blogsDir = path.join(process.cwd(), 'src', 'data', 'blogs');
    
    try {
      await fs.access(blogsDir);
    } catch {
      await fs.mkdir(blogsDir, { recursive: true });
    }

    const blogPath = path.join(blogsDir, `${blog.slug}.json`);
    
    // Verificar si ya existe
    try {
      await fs.access(blogPath);
      return res.status(409).json({
        success: false,
        message: 'Blog con ese slug ya existe'
      });
    } catch {
      // No existe, continuar
    }

    const blogData = {
      ...blog,
      created: blog.created || new Date().toISOString(),
      updated: new Date().toISOString()
    };

    await fs.writeFile(blogPath, JSON.stringify(blogData, null, 2));

    return res.status(201).json({
      success: true,
      message: 'Blog creado exitosamente',
      blog: blogData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error creando blog',
      error: error.message
    });
  }
}

async function updateBlog(req, res) {
  const { slug, blog } = req.body;
  
  if (!slug || !blog) {
    return res.status(400).json({
      success: false,
      message: 'Slug y datos de blog requeridos'
    });
  }

  try {
    const blogPath = path.join(process.cwd(), 'src', 'data', 'blogs', `${slug}.json`);
    
    // Verificar si existe
    try {
      await fs.access(blogPath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'Blog no encontrado'
      });
    }

    const blogData = {
      ...blog,
      updated: new Date().toISOString()
    };

    await fs.writeFile(blogPath, JSON.stringify(blogData, null, 2));

    return res.status(200).json({
      success: true,
      message: 'Blog actualizado exitosamente',
      blog: blogData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error actualizando blog',
      error: error.message
    });
  }
}

async function deleteBlog(req, res) {
  const { slug } = req.body;
  
  if (!slug) {
    return res.status(400).json({
      success: false,
      message: 'Slug requerido'
    });
  }

  try {
    const blogPath = path.join(process.cwd(), 'src', 'data', 'blogs', `${slug}.json`);
    
    // Verificar si existe
    try {
      await fs.access(blogPath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'Blog no encontrado'
      });
    }

    await fs.unlink(blogPath);

    return res.status(200).json({
      success: true,
      message: 'Blog eliminado exitosamente'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error eliminando blog',
      error: error.message
    });
  }
}

// Función para operaciones organizadas (original organized.js)
async function organizedBlogs(req, res) {
  const { operation } = req.body || req.query;

  switch (operation) {
    case 'getByCategory':
      return await getBlogsByCategory(req, res);
    
    case 'search':
      return await searchBlogs(req, res);
    
    case 'getRecent':
      return await getRecentBlogs(req, res);

    default:
      return res.status(400).json({
        success: false,
        message: 'Operación no válida. Operaciones disponibles: getByCategory, search, getRecent'
      });
  }
}

async function getBlogsByCategory(req, res) {
  const { category } = req.query;
  
  if (!category) {
    return res.status(400).json({
      success: false,
      message: 'Categoría requerida'
    });
  }

  try {
    const blogsDir = path.join(process.cwd(), 'src', 'data', 'blogs');
    const files = await fs.readdir(blogsDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const blogs = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const filePath = path.join(blogsDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const blog = JSON.parse(content);
          return blog.category === category ? blog : null;
        } catch (error) {
          return null;
        }
      })
    );

    const categoryBlogs = blogs.filter(blog => blog !== null);

    return res.status(200).json({
      success: true,
      blogs: categoryBlogs,
      category: category,
      total: categoryBlogs.length
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo blogs por categoría',
      error: error.message
    });
  }
}

async function searchBlogs(req, res) {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({
      success: false,
      message: 'Query de búsqueda requerido'
    });
  }

  try {
    const blogsDir = path.join(process.cwd(), 'src', 'data', 'blogs');
    const files = await fs.readdir(blogsDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const blogs = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const filePath = path.join(blogsDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const blog = JSON.parse(content);
          
          const searchText = `${blog.title} ${blog.content} ${blog.category}`.toLowerCase();
          return searchText.includes(query.toLowerCase()) ? blog : null;
        } catch (error) {
          return null;
        }
      })
    );

    const searchResults = blogs.filter(blog => blog !== null);

    return res.status(200).json({
      success: true,
      blogs: searchResults,
      query: query,
      total: searchResults.length
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error en búsqueda de blogs',
      error: error.message
    });
  }
}

async function getRecentBlogs(req, res) {
  const { limit = 10 } = req.query;

  try {
    const blogsDir = path.join(process.cwd(), 'src', 'data', 'blogs');
    const files = await fs.readdir(blogsDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const blogs = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const filePath = path.join(blogsDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          return JSON.parse(content);
        } catch (error) {
          return null;
        }
      })
    );

    const validBlogs = blogs.filter(blog => blog !== null);
    
    // Ordenar por fecha de creación (más recientes primero)
    validBlogs.sort((a, b) => new Date(b.created || 0) - new Date(a.created || 0));
    
    const recentBlogs = validBlogs.slice(0, parseInt(limit));

    return res.status(200).json({
      success: true,
      blogs: recentBlogs,
      total: recentBlogs.length
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo blogs recientes',
      error: error.message
    });
  }
}