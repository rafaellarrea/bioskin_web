// api/blogs/save.js
// Endpoint para guardar blogs generados en archivo JSON

import fs from 'fs';
import path from 'path';

const BLOGS_FILE = path.join(process.cwd(), 'data', 'generated-blogs.json');

// Asegurar que el directorio existe
const ensureDataDirectory = () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Cargar blogs existentes
const loadBlogs = () => {
  try {
    if (fs.existsSync(BLOGS_FILE)) {
      const data = fs.readFileSync(BLOGS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error cargando blogs:', error);
    return [];
  }
};

// Guardar blogs
const saveBlogs = (blogs) => {
  try {
    ensureDataDirectory();
    fs.writeFileSync(BLOGS_FILE, JSON.stringify(blogs, null, 2));
    return true;
  } catch (error) {
    console.error('Error guardando blogs:', error);
    return false;
  }
};

export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      // Guardar nuevo blog
      const blogData = req.body;
      
      if (!blogData || !blogData.title || !blogData.content) {
        return res.status(400).json({
          success: false,
          message: 'Datos del blog incompletos'
        });
      }

      const blogs = loadBlogs();
      
      // Verificar que no exista un blog con el mismo slug
      const existingBlog = blogs.find(b => b.slug === blogData.slug);
      if (existingBlog) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un blog con ese slug'
        });
      }

      // Añadir el blog
      blogs.push({
        ...blogData,
        saved_at: new Date().toISOString()
      });

      // Guardar en archivo
      const saved = saveBlogs(blogs);
      
      if (saved) {
        return res.status(200).json({
          success: true,
          message: 'Blog guardado exitosamente',
          blog: blogData
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Error guardando el blog'
        });
      }
    } 
    
    else if (req.method === 'GET') {
      // Obtener todos los blogs guardados
      const blogs = loadBlogs();
      
      return res.status(200).json({
        success: true,
        blogs: blogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        count: blogs.length
      });
    }
    
    else {
      return res.status(405).json({
        success: false,
        message: 'Método no permitido'
      });
    }

  } catch (error) {
    console.error('Error en API de blogs:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}