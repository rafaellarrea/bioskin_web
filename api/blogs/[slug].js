// api/blogs/[slug].js
// Endpoint para obtener un blog específico por slug

import { getCompleteBlog } from '../../lib/database.js';

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
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({
      success: false,
      message: 'Slug es requerido'
    });
  }

  try {
    const blog = getCompleteBlog(slug);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog no encontrado'
      });
    }

    // Formatear respuesta
    const formattedBlog = {
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
    };

    res.status(200).json({
      success: true,
      blog: formattedBlog
    });

  } catch (error) {
    console.error('Error obteniendo blog:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error obteniendo blog de la base de datos',
      error: {
        message: error.message,
        name: error.name
      }
    });
  }
}