// api/cron/generate-blog.js

import { generateAutomaticBlog } from '../ai-blog/generate.js';

export default async function handler(req, res) {
  // Verificar que la solicitud viene de Vercel Cron
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  try {
    console.log('Ejecutando generación automática de blog...');
    
    // Generar blog automáticamente
    const result = await generateAutomaticBlog();
    
    if (result && result.success) {
      console.log(`Blog generado exitosamente: ${result.blog.title}`);
      res.status(200).json({
        success: true,
        message: 'Blog generado automáticamente',
        blog: {
          title: result.blog.title,
          category: result.blog.category,
          publishedAt: result.blog.publishedAt
        }
      });
    } else {
      throw new Error('Error en la generación automática');
    }
    
  } catch (error) {
    console.error('Error en tarea programada:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la generación automática',
      error: error.message
    });
  }
}