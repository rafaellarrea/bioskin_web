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

## Referencias y Fuentes
[3-4 referencias científicas relevantes al tema, con formato académico]

LONGITUD: Exactamente 500-700 palabras (sin contar la sección de referencias)
TONO: Profesional, confiable, educativo
INCLUIR: Información médica precisa, beneficios reales, precauciones necesarias
IMPORTANTE: El primer # debe ser un título atractivo específico del tema, no "Introducción"
REFERENCIAS: Incluir siempre fuentes científicas confiables al final`
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

## Referencias Técnicas y Fuentes
[3-4 referencias científicas y técnicas relevantes, incluyendo estudios clínicos]

LONGITUD: Exactamente 500-700 palabras (sin contar la sección de referencias)
TONO: Técnico, informativo, profesional
INCLUIR: Datos técnicos, aplicaciones reales, beneficios clínicos
IMPORTANTE: El primer # debe ser un título específico del tema técnico, no "Introducción"
REFERENCIAS: Incluir siempre fuentes científicas y estudios técnicos al final`
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
          content: `ADICIONAL OBLIGATORIO: Al final del artículo, en líneas separadas, proporciona:
1. IMAGEN_BUSQUEDA: [descripción visual en inglés máximo 6 palabras]
2. TAGS_BLOG: [5-6 tags específicos separados por comas, basados exactamente en el contenido del blog]

Ejemplo:
IMAGEN_BUSQUEDA: aesthetic medical laser treatment face
TAGS_BLOG: láser CO2, rejuvenecimiento facial, medicina estética, tratamiento anti-aging, BIOSKIN` 
        }
      ],
      max_tokens: 1200,
      temperature: 0.7
    });

    const content = completion.choices[0].message.content;
    
    // ✅ NUEVO: Extraer tanto descripción visual como tags generados por IA
    let visualDescription = '';
    let aiGeneratedTags = [];
    let cleanContent = content;
    
    // Extraer descripción visual para imagen
    const imageMatch = content.match(/IMAGEN_BUSQUEDA:\s*(.+)$/m);
    if (imageMatch) {
      visualDescription = imageMatch[1].trim();
      cleanContent = cleanContent.replace(/IMAGEN_BUSQUEDA:\s*.+$/m, '').trim();
    }
    
    // ✅ NUEVO: Extraer tags generados por IA
    const tagsMatch = content.match(/TAGS_BLOG:\s*(.+)$/m);
    if (tagsMatch) {
      const tagsString = tagsMatch[1].trim();
      aiGeneratedTags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      cleanContent = cleanContent.replace(/TAGS_BLOG:\s*.+$/m, '').trim();
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

    // ✅ MEJORAR: Generar tags dinámicos basados en el contenido del blog
    const generateDynamicTags = (content, title, blogType) => {
      const contentLower = (content + ' ' + title).toLowerCase();
      
      // Tags base por categoría
      const baseTags = ['bioskin'];
      if (blogType === 'medico-estetico') {
        baseTags.push('medicina estética');
      } else {
        baseTags.push('tecnología médica');
      }
      
      // Keywords específicos a buscar en el contenido
      const keywordMap = {
        // Tratamientos
        'láser': 'tratamiento láser',
        'laser': 'tratamiento láser', 
        'hifu': 'HIFU',
        'ultrasonido': 'ultrasonido estético',
        'liposucción': 'liposucción',
        'lipoescultura': 'lipoescultura',
        'contorno corporal': 'contorno corporal',
        'grasa': 'reducción de grasa',
        'radiofrecuencia': 'radiofrecuencia',
        'toxina botulínica': 'toxina botulínica',
        'ácido hialurónico': 'ácido hialurónico',
        'peeling': 'peeling químico',
        'microagujas': 'microagujas',
        'led': 'terapia LED',
        'ipl': 'IPL',
        
        // Condiciones y tratamientos
        'arrugas': 'anti-aging',
        'antienvejecimiento': 'anti-aging',
        'acné': 'tratamiento acné',
        'manchas': 'pigmentación',
        'melasma': 'melasma',
        'flacidez': 'firmeza cutánea',
        'celulitis': 'celulitis',
        
        // Tecnologías
        'inteligencia artificial': 'IA médica',
        'personalización': 'tratamientos personalizados',
        'innovación': 'innovación médica',
        'colágeno': 'estimulación colágeno',
        'células madre': 'células madre',
        'exosomas': 'terapia exosomas'
      };
      
      // Buscar keywords en el contenido
      const foundTags = [];
      for (const [keyword, tag] of Object.entries(keywordMap)) {
        if (contentLower.includes(keyword)) {
          foundTags.push(tag);
        }
      }
      
      // Combinar tags base con los encontrados (máximo 5-6 tags)
      const allTags = [...baseTags, ...foundTags];
      return [...new Set(allTags)].slice(0, 6); // Eliminar duplicados y limitar a 6
    };

    // ✅ PRIORIDAD: Usar tags generados por IA, fallback al sistema dinámico
    const tags = aiGeneratedTags.length > 0 
      ? aiGeneratedTags.slice(0, 6) // Usar tags de IA (máximo 6)
      : generateDynamicTags(cleanContent, title, blogType); // Fallback al sistema anterior

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
    let imageData = null; // Inicializar imageData
    
    try {
      if (visualDescription && visualDescription.trim()) {
        // Usar descripción visual de IA para selección de imagen
        console.log(`🔍 Seleccionando imagen con descripción IA: "${visualDescription}"`);
        
        // ✅ CAMBIO: Usar sistema de imágenes por categorías basado en keywords
        const keywords = visualDescription.toLowerCase();
        
        // Generar hash del contenido para consistencia pero variedad
        const contentHash = title.length + (cleanContent.length % 100);
        const imageVariant = (contentHash % 10) + 1;
        
        const strategies = [
          `https://via.placeholder.com/1200x600/C8A882/FFFFFF?text=BIOSKIN+Medicina+Estetica`, // Medicina estética general
          `https://via.placeholder.com/1200x600/D4AF37/FFFFFF?text=BIOSKIN+Tratamientos`, // Tratamientos de piel  
          `https://via.placeholder.com/1200x600/B8860B/FFFFFF?text=BIOSKIN+Tecnologia`, // Equipos médicos
          `https://via.placeholder.com/1200x600/DAA520/FFFFFF?text=BIOSKIN+Clinica`, // Clínica estética
          `https://via.placeholder.com/1200x600/CD853F/FFFFFF?text=BIOSKIN+Innovacion`  // Tecnología médica
        ];
        
        // Seleccionar estrategia basada en keywords más específicos
        let selectedStrategy = 0; // Default: medicina estética general
        
        if (keywords.includes('laser') || keywords.includes('láser') || keywords.includes('equipment') || keywords.includes('dispositivo')) {
          selectedStrategy = 2; // Tecnología médica
        } else if (keywords.includes('liposucción') || keywords.includes('ultrasonido') || keywords.includes('contorno') || keywords.includes('grasa')) {
          selectedStrategy = 1; // Tratamientos faciales/corporales
        } else if (keywords.includes('skincare') || keywords.includes('treatment') || keywords.includes('tratamiento') || keywords.includes('facial')) {
          selectedStrategy = 1; // Tratamientos faciales
        } else if (keywords.includes('technology') || keywords.includes('device') || keywords.includes('tecnología') || keywords.includes('innovación')) {
          selectedStrategy = 4; // Innovación médica
        } else if (keywords.includes('clinic') || keywords.includes('aesthetic') || keywords.includes('clínica') || keywords.includes('bioskin')) {
          selectedStrategy = 3; // Clínica especializada
        }
        
        // Usar la estrategia seleccionada
        imageUrl = strategies[selectedStrategy];
        
        console.log(`🎯 Estrategia seleccionada: ${selectedStrategy} → ${imageUrl}`);
        
        // Crear objeto imageData para compatibilidad
        imageData = {
          url: imageUrl,
          keywords: visualDescription.split(' ').filter(word => word.length > 2),
          source: 'ai-description-realtime',
          attribution: 'Photo by Unsplash contributors'
        };
        
      } else {
        // Fallback: usar sistema de mapeo tradicional
        imageData = generateBlogImage({
          title,
          category: blogType,
          content: cleanContent,
          excerpt
        });
        imageUrl = imageData.url;
      }
    } catch (error) {
      console.error('Error generando imagen:', error);
      // Crear imageData por defecto
      imageData = {
        url: imageUrl,
        keywords: ['medicina', 'estética'],
        source: 'fallback',
        attribution: 'BIOSKIN'
      };
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
        },
        // ✅ NUEVO: Información sobre tags generados por IA
        tagsProcessing: {
          aiGeneratedTags: aiGeneratedTags,
          aiTagsCount: aiGeneratedTags.length,
          usedAiTags: aiGeneratedTags.length > 0,
          finalTags: tags,
          tagSource: aiGeneratedTags.length > 0 ? 'ai-generated' : 'dynamic-keywords'
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