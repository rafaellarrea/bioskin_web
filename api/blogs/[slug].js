// api/blogs/[slug].js

import { getCompleteBlog } from '../../lib/database.js';

export default async function handler(req, res) {
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
      image: blog.image,
      featured: blog.featured,
      tags: blog.tags || [],
      citations: blog.citations || [],
      createdAt: blog.created_at,
      updatedAt: blog.updated_at
    };

    res.status(200).json({
      success: true,
      blog: formattedBlog
    });

  } catch (error) {
    console.error('Error obteniendo blog:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo blog',
      error: error.message
    });
  }
}