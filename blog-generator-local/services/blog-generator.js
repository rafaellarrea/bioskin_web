// services/blog-generator.js - Servicio de generación de blogs con IA
const OpenAI = require('openai');

class BlogGenerator {
  constructor() {
    this.openai = null;
    this.initializeOpenAI();
  }

  initializeOpenAI() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  OPENAI_API_KEY no configurada. Asegúrate de configurarla en .env');
      return;
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // Prompts especializados (copiados de nuestro sistema)
  getBlogPrompts() {
    return {
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

## Protocolo de Tratamiento BIOSKIN

### Evaluación Inicial
[Proceso de evaluación y selección de candidatos]

### Sesiones Recomendadas
[Número de sesiones, intervalos, mantenimiento]

### Parámetros Técnicos
[Especificaciones técnicas del equipo/tratamiento]

## Beneficios y Ventajas

### Beneficios Clínicos
[Lista de beneficios médicos comprobados]

### Tiempo de Recuperación
[Cronograma detallado de recuperación]

## Indicaciones y Contraindicaciones

### Candidatos Ideales
[Perfil del paciente ideal]

### Contraindicaciones
[Lista de contraindicaciones absolutas y relativas]

## Cuidados Post-Tratamiento

### Primeras 48 Horas
[Cuidados inmediatos]

### Primera Semana
[Cuidados durante la primera semana]

### Seguimiento
[Plan de seguimiento a largo plazo]

## Resultados Esperados

### Mejoras Graduales
[Timeline de resultados esperados]

### Porcentajes de Mejora
[Datos estadísticos de eficacia]

## Tecnología de Vanguardia en BIOSKIN

[Descripción de la tecnología específica utilizada en BIOSKIN]

## Conclusión

[Resumen profesional y llamada a la acción para agendar consulta]

IMPORTANTE: 
- Usa términos médicos apropiados pero explícalos
- Incluye datos específicos y porcentajes cuando sea posible
- Mantén un tono profesional pero accesible
- Menciona BIOSKIN naturalmente en el contexto`
      },

      'tecnico': {
        systemPrompt: `Eres un ingeniero biomédico especialista en equipos de medicina estética que escribe contenido técnico para profesionales del sector.

INSTRUCCIONES ESPECÍFICAS:
- Escribe en español técnico profesional
- Extensión: 1000-1400 palabras exactas
- Incluye especificaciones técnicas detalladas y precisas
- Enfoque en parámetros, protocolos y funcionamiento
- Estructura: Secciones técnicas con datos cuantitativos
- Dirigido a médicos y técnicos especializados`,

        userPrompt: (topic) => `Escribe un artículo técnico profesional sobre: "${topic}"

ESTRUCTURA TÉCNICA REQUERIDA:
# [TÍTULO TÉCNICO ESPECÍFICO]

[Introducción técnica con contexto científico]

## Fundamentos Tecnológicos

### Principios Físicos
[Base científica y física del funcionamiento]

### Especificaciones Técnicas
[Parámetros técnicos detallados]

## Parámetros de Configuración

### Configuración Básica
[Parámetros estándar]

### Configuración Avanzada
[Parámetros para casos específicos]

### Protocolos de Calibración
[Procedimientos de calibración]

## Aplicaciones Clínicas

### Indicaciones Técnicas
[Aplicaciones específicas con parámetros]

### Protocolos de Tratamiento
[Procedimientos técnicos paso a paso]

## Seguridad y Mantenimiento

### Sistemas de Seguridad
[Mecanismos de seguridad integrados]

### Mantenimiento Preventivo
[Rutinas de mantenimiento]

### Solución de Problemas
[Guía de troubleshooting técnico]

## Análisis de Rendimiento

### Eficacia Medida
[Datos de rendimiento cuantitativos]

### Comparativas Técnicas
[Comparación con otros equipos]

## Innovaciones Tecnológicas

### Últimos Desarrollos
[Avances tecnológicos recientes]

### Perspectivas Futuras
[Tendencias tecnológicas]

## Conclusiones Técnicas

[Resumen técnico y recomendaciones profesionales]

REQUERIMIENTOS TÉCNICOS:
- Incluye valores numéricos específicos
- Usa terminología técnica apropiada
- Proporciona datos cuantitativos
- Mantén precisión científica
- Incluye referencias a estándares cuando corresponda`
      }
    };
  }

  // Generar slug desde título
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Extraer título del contenido
  extractTitle(content) {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : 'Blog Sin Título';
  }

  // Generar excerpt del contenido
  generateExcerpt(content, maxLength = 150) {
    // Remover markdown y obtener primer párrafo
    const plainText = content
      .replace(/^#.*$/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .trim();

    const firstParagraph = plainText.split('\n\n')[0] || plainText.split('\n')[0] || '';
    
    if (firstParagraph.length <= maxLength) {
      return firstParagraph;
    }
    
    return firstParagraph.substring(0, maxLength).trim() + '...';
  }

  // Generar tags automáticamente
  generateTags(content, category) {
    const baseTags = category === 'tecnico' 
      ? ['tecnología', 'equipos médicos', 'parámetros técnicos', 'BIOSKIN']
      : ['medicina estética', 'tratamientos', 'BIOSKIN', 'rejuvenecimiento'];

    // Extraer palabras clave del contenido
    const keywordPatterns = [
      /\b(láser|laser)\b/gi,
      /\b(IPL|luz pulsada)\b/gi,
      /\bHIFU\b/gi,
      /\bradiofrecuencia\b/gi,
      /\b(ácido hialurónico|hialurónico)\b/gi,
      /\b(colágeno|colageno)\b/gi,
      /\b(botox|toxina botulínica)\b/gi,
      /\b(peeling|exfoliación)\b/gi,
      /\b(mesoterapia)\b/gi,
      /\b(bioestimulador|bioestimuladores)\b/gi
    ];

    const foundKeywords = [];
    keywordPatterns.forEach(pattern => {
      const match = content.match(pattern);
      if (match) {
        foundKeywords.push(match[0].toLowerCase());
      }
    });

    return [...baseTags, ...foundKeywords].slice(0, 8);
  }

  // Método principal para generar blog
  async generateBlog({ blogType = 'medico-estetico', topic, manual = false }) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI no está configurado. Verifica tu API key en .env');
      }

      console.log(`🤖 Generando blog: ${topic} (Tipo: ${blogType})`);

      const prompts = this.getBlogPrompts();
      const selectedPrompt = prompts[blogType];

      if (!selectedPrompt) {
        throw new Error(`Tipo de blog no válido: ${blogType}`);
      }

      // Generar contenido con OpenAI
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { 
            role: "system", 
            content: selectedPrompt.systemPrompt 
          },
          { 
            role: "user", 
            content: selectedPrompt.userPrompt(topic) 
          }
        ],
        max_tokens: 3000,
        temperature: 0.7
      });

      const content = completion.choices[0].message.content;

      // Procesar el contenido generado
      const title = this.extractTitle(content);
      const slug = this.generateSlug(title);
      const excerpt = this.generateExcerpt(content);
      const tags = this.generateTags(content, blogType);

      // Crear estructura del blog
      const blogData = {
        id: `blog-${Date.now()}`,
        title: title,
        slug: slug,
        excerpt: excerpt,
        content: content,
        category: blogType,
        author: blogType === 'tecnico' ? 'BIOSKIN Técnico' : 'BIOSKIN Médico',
        publishedAt: new Date().toISOString(),
        readTime: Math.ceil(content.length / 1000), // Aproximado
        tags: tags,
        image: '', // Se añadirá en el editor
        imagenPrincipal: '',
        imagenConclusion: '',
        featured: false,
        source: 'ai-generated-local'
      };

      console.log(`✅ Blog generado exitosamente: ${title}`);

      return {
        success: true,
        blog: blogData,
        message: 'Blog generado exitosamente',
        stats: {
          words: content.split(' ').length,
          readTime: blogData.readTime,
          category: blogType
        }
      };

    } catch (error) {
      console.error('❌ Error generando blog:', error);

      return {
        success: false,
        message: 'Error generando el blog',
        error: error.message,
        details: error.toString()
      };
    }
  }

  // Validar API Key
  async validateApiKey() {
    try {
      if (!this.openai) {
        return {
          valid: false,
          message: 'OpenAI no configurado'
        };
      }

      // Hacer una llamada simple para validar
      await this.openai.models.list();

      return {
        valid: true,
        message: 'API Key válida'
      };

    } catch (error) {
      return {
        valid: false,
        message: 'API Key inválida o error de conexión',
        error: error.message
      };
    }
  }
}

module.exports = BlogGenerator;