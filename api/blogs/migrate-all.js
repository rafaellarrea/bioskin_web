// api/blogs/migrate-all.js
// Endpoint especial para migrar TODOS los blogs de localStorage a almacenamiento permanente

import { getDynamicBlogs, addDynamicBlog } from '../../lib/dynamic-blogs-storage.js';
import fs from 'fs';
import path from 'path';

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
    const { blogs } = req.body;

    if (!blogs || !Array.isArray(blogs)) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de blogs'
      });
    }

    const results = {
      total: blogs.length,
      processed: 0,
      added: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    // Obtener blogs existentes del servidor
    const existingBlogs = getDynamicBlogs();

    // Procesar cada blog recibido
    for (const blog of blogs) {
      try {
        results.processed++;

        // Verificar si ya existe por slug o ID
        const exists = existingBlogs.find(existing => 
          existing.slug === blog.slug || existing.id === blog.id
        );

        if (exists) {
          results.skipped++;
          console.log(`Blog ya existe: ${blog.title}`);
          continue;
        }

        // Formatear el blog correctamente
        const formattedBlog = {
          id: blog.id || `blog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: blog.title,
          slug: blog.slug,
          excerpt: blog.excerpt || blog.title.substring(0, 150) + '...',
          content: blog.content || '',
          category: blog.category || 'medico-estetico',
          author: blog.author || 'BIOSKIN IA',
          publishedAt: blog.publishedAt || new Date().toISOString(),
          readTime: blog.readTime || blog.read_time || 5,
          tags: Array.isArray(blog.tags) ? blog.tags : [],
          image: blog.image || blog.imagenPrincipal || `/images/productos/dispositivos/${blog.category}/equipo-principal.jpg`,
          imagenPrincipal: blog.imagenPrincipal || blog.image || '',
          imagenConclusion: blog.imagenConclusion || '',
          featured: Boolean(blog.featured),
          source: 'dynamic',
          createdAt: blog.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Agregar al sistema dinámico
        const addResult = addDynamicBlog(formattedBlog);

        if (addResult && addResult.success !== false) {
          results.added++;
          console.log(`✅ Blog agregado: ${formattedBlog.title}`);
        } else {
          results.errors.push(`Error agregando ${blog.title}: ${addResult.error || 'Error desconocido'}`);
        }

      } catch (blogError) {
        results.errors.push(`Error procesando ${blog.title || 'blog desconocido'}: ${blogError.message}`);
        console.error('Error procesando blog:', blogError);
      }
    }

    // También guardar en archivo JSON para backup permanente
    try {
      const backupPath = path.join(process.cwd(), 'data', 'blogs-backup.json');
      const allCurrentBlogs = getDynamicBlogs();
      fs.writeFileSync(backupPath, JSON.stringify(allCurrentBlogs, null, 2), 'utf8');
      console.log(`📁 Backup guardado: ${allCurrentBlogs.length} blogs`);
    } catch (backupError) {
      console.error('Error guardando backup:', backupError);
    }

    const response = {
      success: true,
      message: `Migración completada: ${results.added} blogs agregados de ${results.total} procesados`,
      results: results,
      newTotal: getDynamicBlogs().length
    };

    console.log('📊 Resultado migración:', response);
    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error en migración completa:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor durante la migración',
      error: error.message
    });
  }
}