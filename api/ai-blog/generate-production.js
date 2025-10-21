// api/ai-blog/generate-production.js
// Versión de producción CON guardado en base de datos SQLite

import { createCompleteBlog } from '../../lib/database.js';
import { generateBlogImage } from '../../lib/image-search-service.js';

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
      endpoint: '/api/ai-blog/generate-production'
    });
  }

  try {
    // Verificar variable de entorno
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'OPENAI_API_KEY no configurada',
        error: 'Variable de entorno faltante',
        endpoint: '/api/ai-blog/generate-production'
      });
    }

    const { 
      blogType = 'medico-estetico', 
      topic = 'Tratamientos de medicina estética',
      manual = false 
    } = req.body || {};

    // Validar tipo de blog
    if (!['medico-estetico', 'tecnico'].includes(blogType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tipo de blog inválido. Usar: medico-estetico o tecnico'
      });
    }

    // Importar OpenAI
    const { OpenAI } = await import('openai');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Prompts especializados
    const BLOG_PROMPTS = {
      'medico-estetico': {
        systemPrompt: `Eres un experto en medicina estética que escribe blogs profesionales para BIOSKIN, una clínica especializada en tratamientos médico-estéticos. 

INSTRUCCIONES ESPECÍFICAS:
- Escribe en español profesional y accesible
- Extensión: 500-700 palabras exactas
- Incluye información médica precisa y actualizada
- Menciona BIOSKIN como la clínica de referencia
- Estructura: Introducción, desarrollo con subsecciones, conclusión
- Incluye llamada a la acción al final`,
        
        userPrompt: (topic) => `Escribe un blog profesional sobre: "${topic}"

ESTRUCTURA REQUERIDA:
# [TÍTULO ATRACTIVO Y PROFESIONAL SOBRE EL TEMA]

## Introducción
[Párrafo explicando qué es el tratamiento y por qué es relevante]

## ¿Qué es y cómo funciona?
[Explicación técnica pero accesible del procedimiento]

## Principales beneficios
[Lista numerada de 4-5 beneficios principales con explicación]

## Proceso del tratamiento
[Descripción paso a paso del procedimiento]

## Cuidados importantes
### Pre tratamiento:
### Post tratamiento:

## Conclusión
[Resumen y invitación a consulta en BIOSKIN]

LONGITUD: Exactamente 500-700 palabras
TONO: Profesional, confiable, educativo
INCLUIR: Información médica precisa, beneficios reales, precauciones necesarias
IMPORTANTE: El primer # debe ser un título atractivo específico del tema, no "Introducción"`
      },
      
      'tecnico': {
        systemPrompt: `Eres un especialista en tecnología médica que escribe contenido técnico para BIOSKIN sobre equipamiento y innovaciones en medicina estética.

INSTRUCCIONES ESPECÍFICAS:
- Escribe en español técnico pero comprensible
- Extensión: 500-700 palabras exactas
- Incluye especificaciones técnicas relevantes
- Explica aplicaciones clínicas reales
- Menciona ventajas competitivas del equipo
- Estructura: Introducción, características técnicas, aplicaciones, conclusión`,
        
        userPrompt: (topic) => `Escribe un artículo técnico sobre: "${topic}"

ESTRUCTURA REQUERIDA:
# [TÍTULO ESPECÍFICO Y TÉCNICO SOBRE EL TEMA]

## Introducción
[Contexto de la tecnología en medicina estética]

## Características técnicas principales
[Especificaciones y capacidades del equipo]

## Aplicaciones clínicas
[Tratamientos y procedimientos donde se utiliza]

## Ventajas competitivas
[Por qué esta tecnología es superior]

## Consideraciones técnicas
[Requisitos, mantenimiento, capacitación]

## Conclusión
[Impacto en la práctica médico-estética]

LONGITUD: Exactamente 500-700 palabras
TONO: Técnico, informativo, profesional
INCLUIR: Datos técnicos, aplicaciones reales, beneficios clínicos
IMPORTANTE: El primer # debe ser un título específico del tema técnico, no "Introducción"`
      }
    };

    const prompt = BLOG_PROMPTS[blogType];
    
    // Generar contenido con OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt.systemPrompt },
        { role: "user", content: prompt.userPrompt(topic) }
      ],
      max_tokens: 1200,
      temperature: 0.7
    });

    const content = completion.choices[0].message.content;
    
    // Extraer título del contenido
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : topic;
    
    // Generar slug
    const slug = title.toLowerCase()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim('-') + '-' + Date.now();

    // Generar extracto
    const firstParagraph = content.split('\n\n')[1] || content.substring(0, 200);
    const excerpt = firstParagraph.replace(/^#+\s+/, '').substring(0, 150) + '...';

    // Generar tags basados en el tipo
    const tags = blogType === 'medico-estetico' 
      ? ['medicina estética', 'tratamientos', 'bioskin', 'belleza', 'salud']
      : ['tecnología médica', 'equipamiento', 'innovación', 'medicina estética', 'bioskin'];

    // Función para obtener semana del año
    const getCurrentWeekYear = () => {
      const date = new Date();
      const week = getWeekNumber(date);
      return `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
    };

    const getWeekNumber = (date) => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    // Generar imagen relevante desde Unsplash
    const imageData = generateBlogImage({
      title,
      category: blogType,
      content: excerpt,
      excerpt
    });

    // Crear objeto blog para la base de datos
    const blogData = {
      title,
      slug,
      excerpt,
      content,
      category: blogType,
      author: 'BIOSKIN IA',
      publishedAt: new Date().toISOString().split('T')[0],
      readTime: Math.ceil(content.split(' ').length / 200),
      image: imageData.url, // Imagen relevante desde Unsplash
      featured: false
    };

    // Guardar en la base de datos SQLite (si es posible)
    let blogId;
    let saveError = null;
    let savedToDynamic = false;
    
    try {
      blogId = createCompleteBlog(blogData, tags, []);
      console.log(`✅ Blog guardado en BD con ID: ${blogId}`);
    } catch (dbError) {
      console.error('❌ Error guardando en BD:', dbError);
      saveError = dbError.message;
      
      // Fallback: guardar dinámicamente en memoria del endpoint estático
      try {
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host;
        const baseUrl = `${protocol}://${host}`;
        
        const fallbackResponse = await fetch(`${baseUrl}/api/blogs/manage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blog: blogData })
        });
        
        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json();
          savedToDynamic = true;
          blogId = fallbackResult.blogId;
          console.log('✅ Blog guardado dinámicamente como fallback');
        }
      } catch (fallbackError) {
        console.error('❌ Error en fallback dinámico:', fallbackError);
      }
    }

    // Crear objeto blog para respuesta
    const blog = {
      id: blogId || Date.now(),
      title,
      slug,
      excerpt,
      content,
      category: blogType,
      blog_type: blogType,
      tags,
      read_time: Math.ceil(content.split(' ').length / 200),
      author: 'BIOSKIN IA',
      published_at: new Date().toISOString().split('T')[0],
      week_year: getCurrentWeekYear(),
      is_ai_generated: true,
      ai_prompt_version: 'v2.0-production',
      created_at: new Date().toISOString(),
      endpoint: '/api/ai-blog/generate-production',
      saved_to_db: !!blogId
    };

    // Respuesta con diagnóstico completo
    const saveMethod = blogId && !savedToDynamic ? 'database' : 
                     savedToDynamic ? 'dynamic-memory' : 'failed';
                     
    res.status(200).json({
      success: true,
      message: blogId 
        ? `Blog generado exitosamente y guardado (${saveMethod})` 
        : `Blog generado pero no guardado. Error: ${saveError || 'desconocido'}`,
      blog,
      meta: {
        wordCount: content.split(' ').length,
        hasOpenAI: true,
        savedToDB: !!blogId && !savedToDynamic,
        savedToDynamic: savedToDynamic,
        saveMethod: saveMethod,
        saveError: saveError,
        endpoint: '/api/ai-blog/generate-production',
        timestamp: new Date().toISOString(),
        environment: process.env.VERCEL ? 'vercel' : 'local',
        isVercel: !!process.env.VERCEL
      }
    });

  } catch (error) {
    console.error('Error en generate-production:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error generando blog en producción',
      error: {
        message: error.message,
        name: error.name
      },
      endpoint: '/api/ai-blog/generate-production'
    });
  }
}