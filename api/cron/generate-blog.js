// api/cron/generate-blog.js

export default async function handler(req, res) {
  // Verificar que la solicitud viene de Vercel Cron
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  try {
    console.log('Ejecutando generación automática de blog...');
    
    // Seleccionar categoría aleatoria
    const categories = ['medico-estetico', 'tecnico'];
    const category = categories[Math.floor(Math.random() * categories.length)];

    // Hacer request interno a la API de generación
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const response = await fetch(`${baseUrl}/api/ai-blog/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ category })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`Blog generado exitosamente: ${result.blog.title}`);
      res.status(200).json({
        success: true,
        message: 'Blog generado automáticamente',
        blog: {
          id: result.blog.id,
          title: result.blog.title,
          category: result.blog.category,
          publishedAt: result.blog.publishedAt
        }
      });
    } else {
      throw new Error(result.message || 'Error en la generación automática');
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