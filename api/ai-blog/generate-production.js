// api/ai-blog/generate-production.js
// Versión de producción CON guardado en base de datos SQLite

import { createCompleteBlog } from '../../lib/database.js';
import { generateBlogImage, getReliableImageUrl } from '../../lib/image-search-service.js';
import { searchRealImage } from '../../lib/real-image-search.js';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

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
      category = 'medico-estetico',
      topic = 'Tratamientos de medicina estética',
      manual = false,
      // ✅ NUEVO: Manejar solicitudes de sugerencias de temas
      requestType,
      generateSuggestions = false,
      customPrompt
    } = req.body || {};

    // ✅ NUEVO: Si se solicitan sugerencias de temas, usar IA para generarlas
    if (requestType === 'topic_suggestions_only' || generateSuggestions) {
      console.log('🎯 Generando sugerencias de temas con IA...');
      
      const suggestionsPrompt = customPrompt || `Genera exactamente 8 sugerencias de temas originales e innovadores para blogs de ${category || blogType} en medicina estética.

CRITERIOS:
- Temas 100% originales y actuales (2024-2025)
- Evita lo obvio y común
- Incluye tecnologías emergentes
- Mezcla enfoques: preventivos, correctivos, regenerativos
- Diferentes edades y tipos de piel
- Comparativas técnicas modernas
- Aspectos de seguridad y regulación

FORMATO: Solo lista numerada con títulos específicos y atractivos.`;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Eres un experto en medicina estética. SIEMPRE generas EXACTAMENTE 8 sugerencias numeradas del 1 al 8. No devuelvas más ni menos de 8 elementos. Cada sugerencia debe ser un título específico e innovador."
            },
            {
              role: "user",
              content: suggestionsPrompt
            }
          ],
          max_tokens: 1200,  // ✅ Aumentado para asegurar 8 sugerencias completas
          temperature: 0.7   // ✅ Reducido para más consistencia
        });

        const suggestionsText = completion.choices[0].message.content;
        
        // Debug: Log de la respuesta completa de OpenAI
        console.log('🔍 Respuesta completa de OpenAI:', suggestionsText);
        
        // Parsear las sugerencias de la respuesta
        const allLines = suggestionsText.split('\n');
        console.log('📋 Total de líneas recibidas:', allLines.length);
        
        const numberedLines = allLines.filter(line => line.match(/^\d+\./));
        console.log('🔢 Líneas que empiezan con número:', numberedLines.length, numberedLines);
        
        let suggestions = numberedLines
          .map(line => line.replace(/^\d+\.\s*/, '').trim())  // Remover numeración
          .filter(suggestion => suggestion.length > 10);  // Filtrar líneas muy cortas
          
        console.log('✅ Sugerencias procesadas inicial:', suggestions.length, suggestions);
        
        // ✅ GARANTIZAR 8 SUGERENCIAS: Si hay menos de 8, generar las faltantes
        if (suggestions.length < 8) {
          console.log(`⚠️ Solo se generaron ${suggestions.length} sugerencias, agregando más...`);
          
          const fallbackSuggestions = [
            `Tendencias 2024 en ${category}: Lo que Debes Saber en BIOSKIN`,
            `Tecnologías Emergentes para ${category} en BIOSKIN`,
            `Casos de Éxito: Transformaciones Reales en ${category} en BIOSKIN`,
            `Guía Completa de ${category}: Procedimientos Paso a Paso en BIOSKIN`,
            `Mitos vs Realidades en ${category}: La Verdad Según BIOSKIN`,
            `Seguridad Primero: Protocolos de ${category} en BIOSKIN`,
            `El Futuro de ${category}: Innovaciones que Llegan a BIOSKIN`,
            `Personalización en ${category}: Tratamientos a Medida en BIOSKIN`
          ];
          
          // Agregar sugerencias faltantes hasta completar 8
          while (suggestions.length < 8 && fallbackSuggestions.length > 0) {
            const randomIndex = Math.floor(Math.random() * fallbackSuggestions.length);
            const fallback = fallbackSuggestions.splice(randomIndex, 1)[0];
            suggestions.push(fallback);
          }
        }
        
        // Asegurar exactamente 8 sugerencias
        suggestions = suggestions.slice(0, 8);
        console.log('🎯 Sugerencias finales (8 garantizadas):', suggestions.length, suggestions);

        return res.status(200).json({
          success: true,
          suggestions: suggestions,  // Ya garantizamos 8 sugerencias
          category: category || blogType,
          source: 'openai-gpt4',
          generated_at: new Date().toISOString(),
          endpoint: '/api/ai-blog/generate-production',
          debug: {
            rawResponse: suggestionsText,
            processedCount: suggestions.length,
            guaranteedEight: true
          }
        });

      } catch (error) {
        console.error('❌ Error generando sugerencias:', error);
        return res.status(500).json({
          success: false,
          message: 'Error generando sugerencias con IA',
          error: error.message
        });
      }
    }

    // Validar tipo de blog
    if (!['medico-estetico', 'tecnico'].includes(blogType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tipo de blog inválido. Usar: medico-estetico o tecnico'
      });
    }

    // Configurar OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Prompts especializados
    const BLOG_PROMPTS = {
      'medico-estetico': {
        systemPrompt: `Eres un experto en medicina estética que escribe blogs profesionales para BIOSKIN, una clínica especializada en tratamientos médico-estéticos. 

INSTRUCCIONES ESPECÍFICAS:
- Escribe en español profesional y accesible
- Extensión: 800-1200 palabras exactas
- Incluye información médica precisa y actualizada con datos técnicos
- Menciona BIOSKIN como la clínica de referencia con tecnología avanzada
- Estructura: Múltiples secciones técnicas detalladas con subsecciones
- Incluye llamada a la acción específica al final`,
        
        userPrompt: (topic) => `Escribe un blog profesional sobre: "${topic}"

ESTRUCTURA REQUERIDA (SEGUIR EXACTAMENTE):
# [TÍTULO ATRACTIVO Y PROFESIONAL SOBRE EL TEMA]

[Párrafo de introducción explicando la importancia y relevancia del tratamiento]

## ¿Qué es [el tratamiento/tecnología]?

[Explicación técnica accesible del procedimiento, incluyendo mecanismo de acción]

### Aplicaciones Principales / Mecanismo de Acción

**1. [Primera aplicación/beneficio]**
- Punto específico 1
- Punto específico 2
- Punto específico 3

**2. [Segunda aplicación/beneficio]**
- Punto específico 1
- Punto específico 2
- Punto específico 3

**3. [Tercera aplicación/beneficio]**
- Punto específico 1
- Punto específico 2
- Punto específico 3

## Protocolo de Tratamiento BIOSKIN

### Evaluación Inicial
[Proceso de evaluación inicial]

### Sesiones Recomendadas
- **Serie inicial**: [número] sesiones
- **Intervalo**: [tiempo entre sesiones]
- **Mantenimiento**: [frecuencia de mantenimiento]

### Parámetros Técnicos
- [Parámetro 1]: [valores]
- [Parámetro 2]: [valores]
- [Parámetro 3]: [valores]

## Ventajas del Sistema [Nombre del tratamiento]

### Beneficios Clínicos
- **[Beneficio 1]**: [Explicación detallada]
- **[Beneficio 2]**: [Explicación detallada]
- **[Beneficio 3]**: [Explicación detallada]
- **[Beneficio 4]**: [Explicación detallada]

### Tiempo de Recuperación
- **Inmediato**: [Descripción]
- **24-48h**: [Descripción]
- **1 semana**: [Descripción]
- **2-4 semanas**: [Descripción]

## Indicaciones y Contraindicaciones

### Candidatos Ideales
- [Criterio 1]
- [Criterio 2]
- [Criterio 3]
- [Criterio 4]

### Contraindicaciones Absolutas
- [Contraindicación 1]
- [Contraindicación 2]
- [Contraindicación 3]
- [Contraindicación 4]

## Cuidados Post-Tratamiento

### Primeras 48 Horas
- [Cuidado específico 1]
- [Cuidado específico 2]
- [Cuidado específico 3]

### Primera Semana
- [Cuidado específico 1]
- [Cuidado específico 2]
- [Cuidado específico 3]

### Seguimiento
- [Protocolo de seguimiento detallado]

## Resultados Esperados

### Mejoras Graduales
- **Semana 1-2**: [Descripción de cambios]
- **Semana 3-4**: [Descripción de cambios]
- **Mes 2-3**: [Descripción de cambios]
- **Mes 4-6**: [Descripción de cambios]

### Porcentajes de Mejora
- [Aspecto 1]: [Porcentaje]%
- [Aspecto 2]: [Porcentaje]%
- [Aspecto 3]: [Porcentaje]%
- Satisfacción del paciente: [Porcentaje]%

## Tecnología de Vanguardia en BIOSKIN

[Descripción de la tecnología específica que usa BIOSKIN, incluyendo:]

- **[Característica 1]**
- **[Característica 2]**
- **[Característica 3]**
- **[Característica 4]**

## Conclusión

[Párrafo de conclusión que resuma los beneficios principales y invite a la acción]

**¿Interesado en conocer más sobre nuestros tratamientos [nombre del tratamiento]? Agenda tu consulta de evaluación sin costo.**

FORMATO DE RESPUESTA REQUERIDO:
Devuelve contenido en Markdown limpio y bien estructurado:

- Usar exactamente la estructura con títulos ## y ###
- NO incluir líneas de separación como === o ---
- NO usar símbolos >>> <<< o similares  
- Usar **negritas** para términos importantes
- Usar listas con - para viñetas
- Párrafos separados con doble salto de línea
- Call to action al final con formato destacado

LONGITUD: Exactamente 800-1200 palabras
TONO: Profesional, técnico pero accesible, educativo
INCLUIR: Datos específicos, porcentajes, parámetros técnicos, protocolos detallados
IMPORTANTE: Seguir EXACTAMENTE la estructura con subtítulos y formato de listas
FORMATO: Usar **negritas** para términos clave y listas con viñetas para detalles

ENTREGAR CONTENIDO LIMPIO Y LISTO PARA PUBLICAR - Sin símbolos extraños ni formato problemático.`
      },
      
      'tecnico': {
        systemPrompt: `Eres un especialista en tecnología médica que escribe contenido técnico para BIOSKIN sobre equipamiento y innovaciones en medicina estética.

INSTRUCCIONES ESPECÍFICAS:
- Escribe en español técnico pero comprensible
- Extensión: 1000-1400 palabras exactas
- Incluye especificaciones técnicas detalladas con parámetros numéricos
- Explica aplicaciones clínicas reales con protocolos específicos
- Menciona ventajas competitivas del equipo BIOSKIN
- Estructura: Múltiples secciones técnicas especializadas con comparativas`,
        
        userPrompt: (topic) => `Escribe un artículo técnico sobre: "${topic}"

ESTRUCTURA REQUERIDA (SEGUIR EXACTAMENTE):
# [TÍTULO ESPECÍFICO Y TÉCNICO SOBRE EL TEMA]

[Párrafo de introducción técnica sobre la importancia de esta tecnología en medicina estética]

## ¿Qué es la Tecnología [Nombre]?

[Explicación técnica detallada del funcionamiento, incluyendo principios físicos]

### Mecanismo de Acción / Características Técnicas Principales

**1. [Aspecto técnico 1]**
- Especificación técnica 1
- Especificación técnica 2
- Especificación técnica 3

**2. [Aspecto técnico 2]**
- Especificación técnica 1
- Especificación técnica 2
- Especificación técnica 3

**3. [Aspecto técnico 3]**
- Especificación técnica 1
- Especificación técnica 2
- Especificación técnica 3

## Protocolo de Tratamiento BIOSKIN

### Evaluación Inicial Completa
[Proceso técnico de evaluación]

### Áreas de Aplicación Principales
- **[Aplicación 1]**
- **[Aplicación 2]**
- **[Aplicación 3]**
- **[Aplicación 4]**

### Parámetros Técnicos Avanzados
- [Parámetro técnico 1]: [valores específicos]
- [Parámetro técnico 2]: [valores específicos]
- [Parámetro técnico 3]: [valores específicos]
- [Parámetro técnico 4]: [valores específicos]

## Ventajas del Sistema [Tecnología]

### Beneficios Clínicos Superiores
- **[Ventaja técnica 1]**: [Explicación técnica]
- **[Ventaja técnica 2]**: [Explicación técnica]
- **[Ventaja técnica 3]**: [Explicación técnica]
- **[Ventaja técnica 4]**: [Explicación técnica]

### Perfil de Recuperación
- **Inmediato**: [Descripción técnica]
- **24-72h**: [Descripción técnica]
- **1 semana**: [Descripción técnica]
- **4-12 semanas**: [Descripción técnica]

## Indicaciones y Selección de Pacientes

### Candidatos Ideales
- [Criterio técnico 1]
- [Criterio técnico 2]
- [Criterio técnico 3]
- [Criterio técnico 4]

### Contraindicaciones Absolutas
- [Contraindicación técnica 1]
- [Contraindicación técnica 2]
- [Contraindicación técnica 3]
- [Contraindicación técnica 4]

## Protocolo de Sesión Detallado

### Preparación del Paciente
[Pasos técnicos específicos de preparación]

### Ejecución del Tratamiento
[Proceso técnico paso a paso]

### Finalización y Cuidados
[Protocolo técnico de finalización]

## Resultados Clínicos Documentados

### Cronología de Mejoras
- **Inmediato**: [Resultado técnico específico]
- **2-4 semanas**: [Resultado técnico específico]
- **6-12 semanas**: [Resultado técnico específico]
- **3-6 meses**: [Resultado técnico específico]

### Métricas de Eficacia
- [Métrica 1]: [Porcentaje]% de mejora
- [Métrica 2]: [Porcentaje]% de mejora
- [Métrica 3]: [Porcentaje]% de mejora
- Satisfacción del paciente: [Porcentaje]%

## Innovación Tecnológica BIOSKIN

### Equipo de Última Generación
- **[Innovación técnica 1]**
- **[Innovación técnica 2]**
- **[Innovación técnica 3]**
- **[Innovación técnica 4]**

### Ventajas Competitivas
[Lista de ventajas técnicas específicas del equipo BIOSKIN]

## Comparación con Otros Tratamientos

### [Tecnología] vs [Alternativa 1]
- **[Aspecto comparativo 1]**: [Comparación técnica]
- **[Aspecto comparativo 2]**: [Comparación técnica]
- **[Aspecto comparativo 3]**: [Comparación técnica]

## Conclusión

[Párrafo técnico de conclusión sobre el impacto de esta tecnología en medicina estética]

**¿Listo para experimentar [beneficio principal de la tecnología]? Agenda tu consulta especializada y descubre cómo esta tecnología avanzada puede [beneficio específico].**

FORMATO DE RESPUESTA REQUERIDO:
Devuelve contenido en Markdown limpio y bien estructurado:

- Usar exactamente la estructura con títulos ## y ###
- NO incluir líneas de separación como === o ---
- NO usar símbolos >>> <<< o similares  
- Usar **negritas** para términos importantes
- Usar listas con - para viñetas
- Párrafos separados con doble salto de línea
- Call to action al final con formato destacado

LONGITUD: Exactamente 1000-1400 palabras
TONO: Técnico profesional, detallado, científico pero accesible
INCLUIR: Especificaciones técnicas exactas, parámetros numéricos, protocolos detallados, métricas de eficacia
IMPORTANTE: Seguir EXACTAMENTE la estructura con subtítulos técnicos específicos
FORMATO: Usar **negritas** para términos técnicos clave y especificaciones numéricas

ENTREGAR CONTENIDO LIMPIO Y LISTO PARA PUBLICAR - Sin símbolos extraños ni formato problemático.`
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
    
    // ✅ NUEVA FUNCIÓN: Post-procesamiento del contenido generado por IA
    function postProcessAIContent(content) {
      return content
        // Limpiar metadatos de la respuesta
        .replace(/IMAGEN_BUSQUEDA:\s*.+$/m, '')
        .replace(/TAGS_BLOG:\s*.+$/m, '')
        
        // Corregir títulos mal formateados
        .replace(/^#\s+(.+?)\s*##?\s*$/gm, '# $1')  // Títulos principales
        .replace(/^##\s+(.+?)\s*##?\s*$/gm, '## $1') // Subtítulos nivel 2
        .replace(/^###\s+(.+?)\s*##?\s*$/gm, '### $1') // Subtítulos nivel 3
        
        // Eliminar símbolos problemáticos sin tocar markdown válido
        .replace(/>>>\s*(.*?)\s*<<</g, '**$1**')  // >>> texto <<< → **texto**
        .replace(/<<<\s*(.*?)\s*>>>/g, '**$1**')  // <<< texto >>> → **texto**
        .replace(/={20,}/g, '')  // Líneas largas de equals
        .replace(/-{20,}/g, '')  // Líneas largas de guiones
        
        // Preservar markdown válido
        .replace(/\*{3,}/g, '**')  // *** o más → **
        .replace(/\*\*\s*\*\*/g, '')  // ** ** vacíos
        
        // Limpiar espacios y saltos
        .replace(/\n\n\n+/g, '\n\n')  // Múltiples saltos → doble salto
        .replace(/[ ]+$/gm, '')  // Espacios al final de líneas
        .replace(/^\s+$/gm, '')  // Líneas solo con espacios
        
        // Asegurar formato correcto de listas y negritas
        .replace(/^- \*\*(.*?)\*\*\s*:/gm, '- **$1**:')  // Formato de listas
        .replace(/^• /gm, '- ')  // Bullet points → guiones
        .replace(/^→ /gm, '- ')  // Flechas → guiones
        
        .trim();
    }
    
    // ✅ EXTRAER METADATOS Y LIMPIAR CONTENIDO
    // ✅ EXTRAER METADATOS Y LIMPIAR CONTENIDO
    let visualDescription = '';
    let aiGeneratedTags = [];
    let cleanContent = postProcessAIContent(content);  // ✅ Usar función de post-procesamiento
    
    // Extraer descripción visual para imagen (antes del post-procesamiento)
    const imageMatch = content.match(/IMAGEN_BUSQUEDA:\s*(.+)$/m);
    if (imageMatch) {
      visualDescription = imageMatch[1].trim();
    }
    
    // ✅ EXTRAER TAGS GENERADOS POR IA (antes del post-procesamiento)
    const tagsMatch = content.match(/TAGS_BLOG:\s*(.+)$/m);
    if (tagsMatch) {
      const tagsString = tagsMatch[1].trim();
      aiGeneratedTags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
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
    const firstParagraph = content.split('\n\n')[1] || content.substring(0, 250);
    const excerpt = firstParagraph.replace(/^#+\s+/, '').substring(0, 200) + '...';

    // Calcular tiempo de lectura más preciso (palabras por minuto = 200)
    const wordCount = cleanContent.split(/\s+/).filter(word => word.length > 0).length;
    const readTimeMinutes = Math.ceil(wordCount / 200);

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

    // ✅ SISTEMA BÚSQUEDA REAL DE IMÁGENES
    let imageUrl = '/images/logo/logo-bioskin.png'; // Default fallback
    let imageData = null;
    
    try {
      if (aiGeneratedTags.length > 0) {
        // 🎯 BÚSQUEDA REAL: Usar nuevo servicio de búsqueda con tags de IA
        console.log(`🎯 Buscando imagen real usando tags IA: [${aiGeneratedTags.join(', ')}]`);
        
        imageData = await searchRealImage(aiGeneratedTags, visualDescription);
        imageUrl = imageData.url;
        
        console.log(`✅ Imagen encontrada: ${imageData.source} - ${imageData.primaryTerm}`);
        
      } else if (visualDescription && visualDescription.trim()) {
        // Fallback: usar descripción visual si no hay tags de IA
        console.log(`🔄 Fallback: Usando descripción visual: "${visualDescription}"`);
        
        // Usar el mismo servicio de búsqueda pero con descripción visual como fallback
        const fallbackTags = visualDescription.split(' ').filter(word => word.length > 3).slice(0, 3);
        imageData = await searchRealImage(fallbackTags, visualDescription);
        imageUrl = imageData.url;
        
      } else {
        // Último fallback: usar sistema de mapeo tradicional
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
      readTime: readTimeMinutes, // ✅ Usar tiempo de lectura calculado correctamente
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
      read_time: readTimeMinutes, // ✅ Usar tiempo de lectura calculado correctamente
      author: 'BIOSKIN IA',
      published_at: new Date().toISOString().split('T')[0],
      publishedAt: new Date().toISOString().split('T')[0], // Para compatibilidad frontend
      readTime: readTimeMinutes, // ✅ Para compatibilidad frontend
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
        wordCount: wordCount, // ✅ Usar conteo de palabras calculado correctamente
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