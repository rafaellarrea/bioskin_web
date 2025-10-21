// api/blogs/sync-localStorage.js
// Endpoint para sincronizar blogs desde localStorage del cliente al servidor

import { addDynamicBlog, getDynamicBlogs } from '../../lib/dynamic-blogs-storage.js';

export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Solo se permite método POST'
    });
  }

  try {
    const { localStorageBlogs } = req.body;

    if (!localStorageBlogs || !Array.isArray(localStorageBlogs)) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de blogs de localStorage'
      });
    }

    // Obtener blogs dinámicos existentes en el servidor
    const existingBlogs = getDynamicBlogs();
    const results = {
      processed: 0,
      added: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    // Procesar cada blog de localStorage
    for (const localBlog of localStorageBlogs) {
      try {
        results.processed++;

        // Verificar si ya existe en el servidor
        const exists = existingBlogs.find(serverBlog => 
          serverBlog.slug === localBlog.slug || serverBlog.id === localBlog.id
        );

        if (exists) {
          results.skipped++;
          continue;
        }

        // Formatear blog para el servidor
        const formattedBlog = {
          id: localBlog.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
          title: localBlog.title,
          slug: localBlog.slug,
          excerpt: localBlog.excerpt || localBlog.title,
          content: localBlog.content || localBlog.excerpt || '',
          category: localBlog.category || 'medico-estetico',
          author: localBlog.author || 'BIOSKIN IA',
          publishedAt: localBlog.publishedAt || new Date().toISOString(),
          readTime: localBlog.readTime || localBlog.read_time || 5,
          tags: localBlog.tags || [],
          image: localBlog.image || `/images/blog/${localBlog.category || 'medico-estetico'}/default.jpg`,
          imagenPrincipal: localBlog.imagenPrincipal || '',
          imagenConclusion: localBlog.imagenConclusion || '',
          featured: Boolean(localBlog.featured),
          source: 'dynamic',
          createdAt: localBlog.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Agregar al servidor
        const result = addDynamicBlog(formattedBlog);
        
        if (result.success) {
          results.added++;
        } else {
          results.errors.push(`Error agregando ${localBlog.title}: ${result.error}`);
        }

      } catch (error) {
        results.errors.push(`Error procesando ${localBlog.title || 'blog desconocido'}: ${error.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Sincronización completada',
      results,
      endpoint: '/api/blogs/sync-localStorage'
    });

  } catch (error) {
    console.error('Error en sincronización localStorage:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor durante la sincronización',
      error: error.message,
      endpoint: '/api/blogs/sync-localStorage'
    });
  }
}