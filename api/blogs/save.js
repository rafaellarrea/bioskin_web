// api/blogs/save.js
// Endpoint para guardar blogs generados (alternativa a SQLite en Vercel)

export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Método no permitido. Use POST.',
      endpoint: '/api/blogs/save'
    });
  }

  try {
    const { blog } = req.body;

    if (!blog) {
      return res.status(400).json({
        success: false,
        message: 'Blog data es requerido'
      });
    }

    // En Vercel, no podemos escribir archivos, pero podemos usar una estrategia diferente
    // Por ahora, vamos a simular el guardado y devolver el blog
    console.log('📝 Blog recibido para guardar:', blog.title);

    // En un entorno de producción real, aquí conectaríamos a una base de datos externa
    // como Supabase, PlanetScale, o MongoDB Atlas

    res.status(200).json({
      success: true,
      message: 'Blog guardado exitosamente (simulado)',
      blogId: Date.now(),
      endpoint: '/api/blogs/save'
    });

  } catch (error) {
    console.error('Error guardando blog:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error guardando blog',
      error: error.message,
      endpoint: '/api/blogs/save'
    });
  }
}
