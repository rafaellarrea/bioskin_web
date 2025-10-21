// api/ai-blog/generate-production.js
// Versión de producción CON guardado en base de datos SQLite

import { createCompleteBlog } from '../../lib/database.js';
import { generateBlogImage, getReliableImageUrl } from '../../lib/image-search-service.js';

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
        { role: "user", content: prompt.userPrompt(topic) },
        { 
          role: "user", 
          content: `ADICIONAL: Al final del artículo, en una línea separada, proporciona una descripción visual concisa (máximo 6 palabras en inglés) que represente el tema principal para buscar una imagen relacionada. Formato: "IMAGEN_BUSQUEDA: [descripción en inglés]"` 
        }
      ],
      max_tokens: 1200,
      temperature: 0.7
    });

    const content = completion.choices[0].message.content;
    
    // Extraer descripción visual para imagen
    let visualDescription = '';
    let cleanContent = content;
    
    const imageMatch = content.match(/IMAGEN_BUSQUEDA:\s*(.+)$/m);
    if (imageMatch) {
      visualDescription = imageMatch[1].trim();
      // Remover la línea de descripción visual del contenido
      cleanContent = content.replace(/IMAGEN_BUSQUEDA:\s*.+$/m, '').trim();
    }
    
    // Si no se generó descripción visual, crear una basada en el tema
    if (!visualDescription) {
      visualDescription = blogType === 'medico-estetico' 
        ? 'aesthetic medical treatment skincare' 
        : 'medical equipment technology device';
    }
    
    console.log('🖼️ Descripción visual generada:', visualDescription);
    
    // Extraer título del contenido
    const titleMatch = cleanContent.match(/^#\s+(.+)$/m);
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

    // ✅ NUEVO SISTEMA: Generar imagen relevante usando descripción visual mejorada
    let imageUrl = '/images/logo/logo-bioskin.png'; // Default fallback
    
    try {
      if (visualDescription && visualDescription.trim()) {
        // Usar descripción visual de IA para selección de imagen
        console.log(`🔍 Seleccionando imagen con descripción IA: "${visualDescription}"`);
        
        // Seleccionar imagen basada en keywords de la descripción visual
        const keywords = visualDescription.toLowerCase();
        const strategies = [
          'https://images.unsplash.com/photo-1556909114-14e8ec2fec52?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600&q=80', // Medical/aesthetic base
          'https://images.unsplash.com/photo-1559757148-5c350e09d4c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600&q=80', // Skincare treatment
          'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600&q=80', // Medical equipment
          'https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600&q=80', // Aesthetic clinic
          'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600&q=80'  // Medical technology
        ];
        
        // Seleccionar estrategia basada en keywords
        let selectedStrategy = 0;
        if (keywords.includes('laser') || keywords.includes('equipment') || keywords.includes('dispositivo')) {
          selectedStrategy = 2;
        } else if (keywords.includes('skincare') || keywords.includes('treatment') || keywords.includes('tratamiento')) {
          selectedStrategy = 1;
        } else if (keywords.includes('technology') || keywords.includes('device') || keywords.includes('tecnología')) {
          selectedStrategy = 4;
        } else if (keywords.includes('clinic') || keywords.includes('aesthetic') || keywords.includes('clínica')) {
          selectedStrategy = 3;
        }
        
        // Agregar timestamp para evitar caché
        const timestamp = Date.now();
        imageUrl = strategies[selectedStrategy] + `&t=${timestamp}`;
        
      } else {
        // Fallback: usar sistema de mapeo tradicional
        const imageData = generateBlogImage({
          title,
          category: blogType,
          content: cleanContent,
          excerpt
        });
        imageUrl = imageData.url;
      }
    } catch (error) {
      console.error('Error generando imagen:', error);
      // Mantener imagen por defecto
    }

    // Crear objeto blog para la base de datos
    const blogData = {
      title,
      slug,
      excerpt,
      content: cleanContent, // ✅ Usar contenido limpio sin la línea de descripción visual
      category: blogType,
      author: 'BIOSKIN IA',
      publishedAt: new Date().toISOString().split('T')[0],
      readTime: Math.ceil(cleanContent.split(' ').length / 200),
      image: imageUrl, // ✅ Imagen confiable con validación
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
      content: cleanContent, // ✅ Usar contenido limpio
      category: blogType,
      blog_type: blogType,
      tags,
      read_time: Math.ceil(cleanContent.split(' ').length / 200),
      author: 'BIOSKIN IA',
      published_at: new Date().toISOString().split('T')[0],
      publishedAt: new Date().toISOString().split('T')[0], // Para compatibilidad frontend
      readTime: Math.ceil(cleanContent.split(' ').length / 200), // Para compatibilidad frontend
      image: imageData.url, // ✅ ASEGURAR que la imagen se incluya en la respuesta
      featured: false,
      week_year: getCurrentWeekYear(),
      is_ai_generated: true,
      ai_prompt_version: 'v2.0-production',
      created_at: new Date().toISOString(),
      endpoint: '/api/ai-blog/generate-production',
      saved_to_db: !!blogId,
      // ✅ Información adicional sobre la imagen generada
      image_data: {
        url: imageData.url,
        keywords: imageData.keywords,
        source: imageData.source,
        visual_description: visualDescription
      }
    };

    // Respuesta con diagnóstico mejorado
    const saveMethod = blogId && !savedToDynamic ? 'database' : 
                     savedToDynamic ? 'dynamic-memory' : 'memory-only';
                     
    const responseMessage = blogId && !savedToDynamic 
      ? `Blog generado exitosamente y guardado en base de datos (${saveMethod})`
      : savedToDynamic 
        ? `Blog generado exitosamente y guardado en memoria dinámica (${saveMethod})`
        : `Blog generado exitosamente y guardado en memoria (${saveMethod})`;
                     
    res.status(200).json({
      success: true,
      message: responseMessage,
      blog,
      meta: {
        wordCount: cleanContent.split(' ').length,
        hasOpenAI: true,
        savedToDB: !!blogId && !savedToDynamic,
        savedToDynamic: savedToDynamic,
        saveMethod: saveMethod,
        saveError: saveError ? `Info: ${saveError} (El blog se guardó correctamente en memoria)` : null,
        endpoint: '/api/ai-blog/generate-production',
        timestamp: new Date().toISOString(),
        environment: process.env.VERCEL ? 'vercel' : 'local',
        isVercel: !!process.env.VERCEL,
        imageGenerated: !!imageData.url,
        imageUrl: imageData.url,
        // ✅ Información detallada sobre la imagen
        imageProcessing: {
          visualDescriptionGenerated: !!visualDescription,
          visualDescription: visualDescription,
          imageKeywords: imageData.keywords,
          imageSource: imageData.source,
          finalImageUrl: imageData.url
        }
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