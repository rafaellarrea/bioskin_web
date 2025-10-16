// lib/ai-service.js

import OpenAI from 'openai';

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Función para obtener la semana del año en formato ISO
export function getCurrentWeekYear() {
  const date = new Date();
  const week = getWeekNumber(date);
  return `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
}

function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Prompts estructurados para cada tipo de blog
const BLOG_PROMPTS = {
  'medico-estetico': {
    systemPrompt: `Eres un médico especialista en medicina estética con amplia experiencia clínica. 
    
INSTRUCCIONES ESPECÍFICAS:
- Extensión: 500-700 palabras (lectura de 3-4 minutos)
- Tono: Profesional pero accesible, enfoque médico-educativo
- Estructura obligatoria: Introducción breve, 3-4 puntos principales, conclusión práctica
- Incluir beneficios específicos, indicaciones claras y cuidados post-tratamiento
- Mencionar cuándo consultar a un profesional
- Usar terminología médica explicada de forma simple
- NO incluir precios, nombres de marcas específicas o promesas exageradas`,
    
    contentStructure: `
**ESTRUCTURA REQUERIDA:**

**Introducción (80-100 palabras):**
- Contexto del tratamiento/tema
- Por qué es relevante en medicina estética
- Beneficio principal que se abordará

**Desarrollo (300-400 palabras):**
1. **¿Qué es y cómo funciona?** - Explicación técnica simple
2. **Principales beneficios** - 3-4 beneficios específicos
3. **Proceso del tratamiento** - Pasos básicos del procedimiento
4. **Cuidados importantes** - Pre y post tratamiento

**Conclusión (80-100 palabras):**
- Resumen de beneficios clave
- Cuándo considerar el tratamiento
- Importancia de la evaluación profesional

**CALL TO ACTION:**
- Invitación a consulta personalizada en BIOSKIN`
  },
  
  'tecnico': {
    systemPrompt: `Eres un ingeniero biomédico especializado en equipamiento médico estético con conocimiento profundo de tecnologías.
    
INSTRUCCIONES ESPECÍFICAS:
- Extensión: 500-700 palabras (lectura de 3-4 minutos)
- Tono: Técnico pero comprensible, enfoque educativo-tecnológico
- Estructura obligatoria: Introducción técnica, fundamentos, aplicaciones, ventajas
- Incluir principios de funcionamiento, parámetros técnicos básicos
- Mencionar aplicaciones clínicas específicas
- Comparar con otras tecnologías cuando sea relevante
- NO incluir precios de equipos o marcas específicas`,
    
    contentStructure: `
**ESTRUCTURA REQUERIDA:**

**Introducción (80-100 palabras):**
- Presentación de la tecnología
- Importancia en medicina estética moderna
- Objetivo principal del artículo

**Desarrollo (300-400 palabras):**
1. **Principio de funcionamiento** - Base científica/tecnológica
2. **Características técnicas** - Parámetros y especificaciones clave
3. **Aplicaciones clínicas** - Usos específicos en tratamientos
4. **Ventajas tecnológicas** - Beneficios vs otras tecnologías

**Conclusión (80-100 palabras):**
- Resumen de capacidades tecnológicas
- Futuro de la tecnología
- Importancia de la capacitación profesional

**CALL TO ACTION:**
- Conocer los equipos disponibles en BIOSKIN`
  }
};

// Temas predefinidos mejorados
export const BLOG_TOPICS = {
  'medico-estetico': [
    'Ácido Hialurónico: Hidratación Profunda y Rejuvenecimiento Natural',
    'Toxina Botulínica: Prevención y Tratamiento del Envejecimiento Facial',
    'Bioestimuladores de Colágeno: La Nueva Era del Anti-Aging',
    'Tratamiento del Melasma: Protocolos Actuales y Resultados',
    'Hidratación Facial Profunda: Técnicas y Beneficios',
    'Rellenos Dérmicos: Volumización Natural y Segura',
    'Mesoterapia Facial: Nutrición Celular Directa',
    'Peeling Químico: Renovación Cutánea Controlada',
    'Cuidados Post-Tratamiento: Optimizando Resultados',
    'Fotoprotección: Base Fundamental del Anti-Aging',
    'Skinbooster: Revolución en Hidratación Dérmica',
    'Threads PDO: Lifting No Quirúrgico',
    'Tratamientos Combinados: Sinergia en Resultados',
    'Análisis Facial: Diagnóstico Personalizado',
    'Medicina Estética Preventiva: Enfoque Integral'
  ],
  'tecnico': [
    'Tecnología IPL: Fundamentos de la Luz Pulsada Intensa',
    'Láser CO2 Fraccionado: Precisión en Resurfacing Facial',
    'Radiofrecuencia Multipolar: Bioestimulación Térmica',
    'Tecnología HIFU: Ultrasonido Focalizado de Alta Intensidad',
    'Análisis Facial con IA: Diagnóstico Digital Avanzado',
    'LED Terapia: Fototerapia de Baja Intensidad',
    'Microneedling Automatizado: Tecnología Dermapen',
    'Láser Nd:YAG: Versatilidad en Aplicaciones Estéticas',
    'Equipos Multifuncionales: Optimización Tecnológica',
    'Crioterapia Controlada: Aplicaciones en Estética',
    'Ultrasonido Terapéutico: Mecánismos y Protocolos',
    'Vacuum Terapia: Principios y Aplicaciones',
    'Electroterapia Estética: Fundamentos Bioelectrónicos',
    'Calibración de Equipos: Garantía de Seguridad',
    'Innovaciones Tecnológicas: Futuro de la Medicina Estética'
  ]
};

// Función para verificar límites semanales
export async function checkWeeklyLimits(blogType, database) {
  const currentWeek = getCurrentWeekYear();
  
  const stmt = database.prepare(`
    SELECT COUNT(*) as count 
    FROM blogs 
    WHERE week_year = ? AND blog_type = ? AND is_ai_generated = 1
  `);
  
  const result = stmt.get(currentWeek, blogType);
  return result.count < 1; // Máximo 1 por tipo por semana
}

// Función para obtener el estado semanal
export async function getWeeklyStatus(database) {
  const currentWeek = getCurrentWeekYear();
  
  const stmt = database.prepare(`
    SELECT blog_type, COUNT(*) as count 
    FROM blogs 
    WHERE week_year = ? AND is_ai_generated = 1
    GROUP BY blog_type
  `);
  
  const results = stmt.all(currentWeek);
  
  const status = {
    week: currentWeek,
    'medico-estetico': { used: 0, available: 1 },
    'tecnico': { used: 0, available: 1 }
  };
  
  results.forEach(row => {
    status[row.blog_type] = {
      used: row.count,
      available: Math.max(0, 1 - row.count)
    };
  });
  
  return status;
}

// Función principal para generar contenido con OpenAI
export async function generateBlogWithAI(topic, blogType, manual = false) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Configuración de IA no válida. Verificar OPENAI_API_KEY.');
    }

    if (!BLOG_PROMPTS[blogType]) {
      throw new Error(`Tipo de blog no válido: ${blogType}`);
    }

    const prompt = BLOG_PROMPTS[blogType];
    const selectedTopic = topic || getRandomTopic(blogType);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `${prompt.systemPrompt}\n\n${prompt.contentStructure}`
        },
        {
          role: "user",
          content: `Escribe un artículo sobre: "${selectedTopic}"

REQUERIMIENTOS ESPECÍFICOS:
- Extensión: 500-700 palabras exactas
- Tiempo de lectura: 3-4 minutos
- Incluir 4-6 tags relevantes
- Crear un excerpt atractivo de 150-180 caracteres
- Seguir la estructura definida
- Incluir call to action mencionando BIOSKIN
- Lenguaje: Español de Colombia
- Público objetivo: Pacientes interesados en medicina estética

FORMATO DE RESPUESTA (JSON):
{
  "title": "Título atractivo del artículo",
  "excerpt": "Resumen breve de 150-180 caracteres",
  "content": "Contenido completo del artículo en markdown",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "readTime": 4,
  "category": "${blogType}"
}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0].message.content;
    
    // Intentar parsear la respuesta JSON
    let blogData;
    try {
      // Limpiar la respuesta si viene envuelta en markdown
      const cleanResponse = responseText.replace(/```json\n?|\n?```/g, '').trim();
      blogData = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Error parseando respuesta JSON:', parseError);
      throw new Error('Error procesando la respuesta de IA');
    }

    // Validaciones
    if (!blogData.title || !blogData.content || !blogData.excerpt) {
      throw new Error('Respuesta de IA incompleta');
    }

    // Calcular tiempo de lectura basado en palabras
    const wordCount = blogData.content.split(' ').length;
    const calculatedReadTime = Math.ceil(wordCount / 180); // ~180 palabras por minuto

    // Generar slug único
    const baseSlug = generateSlug(blogData.title);
    const timestamp = Date.now();
    const uniqueSlug = `${baseSlug}-${timestamp}`;

    return {
      success: true,
      blog: {
        title: blogData.title,
        slug: uniqueSlug,
        excerpt: blogData.excerpt,
        content: blogData.content,
        category: blogData.category || blogType,
        blog_type: blogType,
        tags: blogData.tags || [],
        readTime: calculatedReadTime,
        author: 'BIOSKIN IA',
        published_at: new Date().toISOString().split('T')[0],
        week_year: getCurrentWeekYear(),
        is_ai_generated: true,
        ai_prompt_version: 'v2.0'
      }
    };

  } catch (error) {
    console.error('Error generando blog con IA:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Función para obtener un tema aleatorio
function getRandomTopic(blogType) {
  const topics = BLOG_TOPICS[blogType];
  return topics[Math.floor(Math.random() * topics.length)];
}

// Función para generar slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[áàäâã]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöôõ]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-')
    .substring(0, 60);
}

// Función para validar configuración de OpenAI
export function validateAIConfiguration() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY no está configurada en las variables de entorno');
  }
  
  console.log('Configuración de OpenAI validada correctamente');
  return true;
}