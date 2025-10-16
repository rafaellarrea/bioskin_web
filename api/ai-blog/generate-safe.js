// api/ai-blog/generate-safe.js
// Versión robusta del generador de blogs con mejor manejo de errores

export default async function handler(req, res) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Método no permitido. Use POST.' 
    });
  }

  try {
    // Verificar variables de entorno básicas
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Configuración de IA no válida',
        error: 'OPENAI_API_KEY no configurada en variables de entorno',
        endpoint: '/api/ai-blog/generate-safe'
      });
    }

    const { 
      blogType = 'medico-estetico', 
      topic, 
      manual = false,
      forceGeneration = false 
    } = req.body || {};

    // Validar tipo de blog
    if (!['medico-estetico', 'tecnico'].includes(blogType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tipo de blog inválido. Usar: medico-estetico o tecnico',
        received: blogType
      });
    }

    // Importaciones dinámicas para mejor manejo de errores
    let aiService, database;
    
    try {
      aiService = await import('../../lib/ai-service.js');
    } catch (importError) {
      return res.status(500).json({
        success: false,
        message: 'Error importando servicio de IA',
        error: importError.message,
        endpoint: '/api/ai-blog/generate-safe'
      });
    }

    try {
      database = await import('../../lib/database.js');
    } catch (importError) {
      return res.status(500).json({
        success: false,
        message: 'Error importando base de datos',
        error: importError.message,
        endpoint: '/api/ai-blog/generate-safe'
      });
    }

    // Generar blog con tema simple para testing
    const selectedTopic = topic || `Blog de prueba sobre ${blogType}`;
    
    // Blog mock para testing en caso de error
    const mockBlog = {
      id: Date.now(),
      title: selectedTopic,
      slug: `${blogType}-${Date.now()}`,
      excerpt: `Este es un extracto de prueba para un blog ${blogType} sobre ${selectedTopic.substring(0, 100)}...`,
      content: `# ${selectedTopic}

## Introducción

Este es un blog de prueba generado para validar el funcionamiento del sistema de blogs de BIOSKIN.

## Desarrollo

El sistema de blogs está diseñado para generar contenido de alta calidad sobre medicina estética y tecnología médica.

### Características principales:
- Generación automática con IA
- Control de límites semanales
- Contenido estructurado
- Base de datos SQLite

## Conclusión

El sistema está funcionando correctamente y puede generar contenido relevante para BIOSKIN.

*Para más información, agenda tu consulta en BIOSKIN.*`,
      category: blogType,
      blog_type: blogType,
      tags: ['test', blogType, 'bioskin'],
      readTime: 3,
      author: 'BIOSKIN IA',
      published_at: new Date().toISOString().split('T')[0],
      week_year: getCurrentWeekYear(),
      is_ai_generated: true,
      ai_prompt_version: 'v2.0-safe'
    };

    // Intentar generar con IA real, usar mock si falla
    let generatedBlog = mockBlog;
    let usingMock = true;

    try {
      if (aiService.generateBlogWithAI) {
        const aiResult = await aiService.generateBlogWithAI(selectedTopic, blogType, manual);
        if (aiResult && aiResult.success) {
          generatedBlog = aiResult.blog;
          usingMock = false;
        }
      }
    } catch (aiError) {
      console.log('AI generation failed, using mock:', aiError.message);
    }

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: usingMock ? 'Blog generado con datos de prueba' : 'Blog generado con IA',
      blog: generatedBlog,
      meta: {
        usingMock,
        endpoint: '/api/ai-blog/generate-safe',
        timestamp: new Date().toISOString(),
        hasOpenAI: !!process.env.OPENAI_API_KEY
      }
    });

  } catch (error) {
    console.error('Error en generate-safe:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: {
        message: error.message,
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      endpoint: '/api/ai-blog/generate-safe'
    });
  }
}

// Función helper para semana del año
function getCurrentWeekYear() {
  const date = new Date();
  const week = getWeekNumber(date);
  return `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
}

function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}