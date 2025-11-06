// api/ai-blog/generate.js
// Versión simplificada que funciona en Vercel SIN dependencias locales

import OpenAI from 'openai';

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
      endpoint: '/api/ai-blog/generate'
    });
  }

  try {
    console.log('🚀 Iniciando generación de blog IA en Vercel');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));

    // Verificar variable de entorno
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY no configurada');
      return res.status(500).json({
        success: false,
        message: 'Configuración de IA no válida. Verificar OPENAI_API_KEY',
        error: 'Variable de entorno faltante',
        endpoint: '/api/ai-blog/generate'
      });
    }

    const { 
      category = 'medico-estetico', 
      customTopic = 'Tratamientos de medicina estética'
    } = req.body || {};

    console.log(`📂 Categoría: ${category}`);
    console.log(`🎯 Tema: ${customTopic}`);

    // Configurar OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log('✅ OpenAI configurado correctamente');

    // Prompt simplificado que funciona bien
    const systemPrompt = `Eres un experto en medicina estética que escribe blogs profesionales para BIOSKIN, una clínica especializada en tratamientos médico-estéticos.

INSTRUCCIONES:
- Escribe en español profesional y accesible
- Extensión: 800-1200 palabras
- Incluye información médica precisa y actualizada
- Menciona BIOSKIN como la clínica de referencia
- Estructura clara con múltiples secciones
- Incluye llamada a la acción al final`;

    const userPrompt = `Escribe un blog profesional sobre: "${customTopic}"

ESTRUCTURA REQUERIDA:
# [TÍTULO ATRACTIVO SOBRE EL TEMA]

[Párrafo de introducción]

## ¿Qué es ${customTopic}?

[Explicación técnica accesible]

## Beneficios Principales

**1. [Beneficio 1]**
- Punto específico 1
- Punto específico 2
- Punto específico 3

**2. [Beneficio 2]** 
- Punto específico 1
- Punto específico 2
- Punto específico 3

**3. [Beneficio 3]**
- Punto específico 1
- Punto específico 2  
- Punto específico 3

## Protocolo de Tratamiento en BIOSKIN

### Evaluación Inicial
[Proceso de evaluación]

### Sesiones Recomendadas
- **Serie inicial**: [número] sesiones
- **Intervalo**: [tiempo entre sesiones] 
- **Mantenimiento**: [frecuencia]

## Resultados Esperados

### Cronología de Mejoras
- **Semana 1-2**: [Descripción]
- **Mes 1-2**: [Descripción]
- **Mes 3-6**: [Descripción]

## Tecnología Avanzada en BIOSKIN

[Descripción de tecnología específica]

## Conclusión

[Párrafo de conclusión con beneficios principales]

**¿Interesado en conocer más? Agenda tu consulta de evaluación sin costo.**

LONGITUD: 800-1200 palabras
TONO: Profesional, educativo, técnico pero accesible
INCLUIR: Datos específicos, parámetros, protocolos detallados`;

    console.log('📤 Enviando prompt a OpenAI...');

    // Generar contenido con OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1200,
      temperature: 0.7
    });

    console.log('✅ Respuesta recibida de OpenAI');

    const content = completion.choices[0].message.content;
    
    // Extraer título del contenido
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : customTopic;
    
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
    const firstParagraph = content.split('\n\n')[1] || content.substring(0, 250);
    const excerpt = firstParagraph.replace(/^#+\s+/, '').substring(0, 200) + '...';

    // Calcular tiempo de lectura
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const readTimeMinutes = Math.ceil(wordCount / 200);

    // Tags básicos
    const tags = [
      'bioskin',
      'medicina estética',
      category === 'medico-estetico' ? 'tratamiento estético' : 'tecnología médica',
      'innovación médica',
      'cuidado de la piel'
    ];

    // Crear objeto blog
    const blog = {
      id: Date.now(),
      title,
      slug,
      excerpt,
      content,
      category,
      tags,
      readTime: readTimeMinutes,
      author: 'BIOSKIN IA',
      publishedAt: new Date().toISOString().split('T')[0],
      image: '/images/logo/logo-bioskin.png',
      featured: false,
      isAiGenerated: true,
      createdAt: new Date().toISOString()
    };

    console.log('✅ Blog generado exitosamente');
    console.log(`📊 Estadísticas: ${wordCount} palabras, ${readTimeMinutes} min lectura`);

    res.status(200).json({
      success: true,
      message: 'Blog generado exitosamente con IA',
      blog,
      meta: {
        wordCount,
        readTime: readTimeMinutes,
        hasOpenAI: true,
        endpoint: '/api/ai-blog/generate',
        timestamp: new Date().toISOString(),
        environment: 'vercel'
      }
    });

  } catch (error) {
    console.error('❌ Error en generación IA:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error generando blog con IA',
      error: {
        message: error.message,
        name: error.name,
        details: error.stack
      },
      endpoint: '/api/ai-blog/generate'
    });
  }
}