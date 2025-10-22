// api/blogs/json-files.js
// Endpoint para servir blogs desde archivos JSON estáticos

import fs from 'fs';
import path from 'path';

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
      success: false,
      message: 'Método no permitido',
      endpoint: '/api/blogs/json-files'
    });
  }

  const { file } = req.query;

  try {
    const blogsDir = path.join(process.cwd(), 'src', 'data', 'blogs');
    
    // Si se solicita un archivo específico
    if (file) {
      const filePath = path.join(blogsDir, file);
      
      // Verificar que el archivo existe y es seguro (no paths maliciosos)
      if (!fs.existsSync(filePath) || !file.endsWith('.json')) {
        return res.status(404).json({
          success: false,
          message: 'Archivo no encontrado',
          file: file
        });
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const blog = JSON.parse(fileContent);
      
      return res.status(200).json({
        success: true,
        blog: {
          ...blog,
          source: 'json-file'
        }
      });
    }

    // Si no se solicita archivo específico, devolver índice
    const indexPath = path.join(blogsDir, 'index.json');
    
    if (!fs.existsSync(indexPath)) {
      return res.status(404).json({
        success: false,
        message: 'Índice de blogs no encontrado'
      });
    }

    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const index = JSON.parse(indexContent);
    
    // Cargar todos los blogs del índice
    const blogs = [];
    for (const fileInfo of index.blogFiles) {
      try {
        const blogPath = path.join(blogsDir, fileInfo.file);
        if (fs.existsSync(blogPath)) {
          const blogContent = fs.readFileSync(blogPath, 'utf8');
          const blog = JSON.parse(blogContent);
          blogs.push({
            ...blog,
            source: 'json-file'
          });
        }
      } catch (error) {
        console.warn(`Error cargando blog ${fileInfo.file}:`, error.message);
      }
    }

    return res.status(200).json({
      success: true,
      index: index,
      blogs: blogs,
      stats: {
        totalFiles: index.blogFiles.length,
        loadedBlogs: blogs.length,
        categories: index.categories
      },
      endpoint: '/api/blogs/json-files'
    });

  } catch (error) {
    console.error('Error en json-files endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
      endpoint: '/api/blogs/json-files'
    });
  }
}