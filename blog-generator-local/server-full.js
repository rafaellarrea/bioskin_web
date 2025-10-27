// server-full.js - Servidor completo con sistema de generación de blogs funcional
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = 3333;

console.log(`
  ╔════════════════════════════════════════╗
  ║        BIOSKIN BLOG GENERATOR          ║
  ║         SERVIDOR COMPLETO              ║
  ╠════════════════════════════════════════╣
  ║  🌐 Servidor: http://localhost:${PORT}     ║
  ║  📝 Generación de blogs con IA         ║
  ║  🖼️  Gestión de imágenes               ║
  ║  🚀 Despliegue automático              ║
  ╚════════════════════════════════════════╝
  
  Presiona Ctrl+C para detener el servidor
  `);

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    fs.ensureDir(uploadsDir);
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

// Verificar directorios
const projectRoot = path.join(__dirname, '../');
const blogsDir = path.join(projectRoot, 'src/data/blogs');

fs.ensureDir(blogsDir).then(() => {
  console.log('📁 Directorios de blogs verificados');
}).catch(err => {
  console.error('❌ Error creando directorios:', err.message);
});

// RUTAS

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Obtener sugerencias de temas
app.get('/api/topic-suggestions', (req, res) => {
  const suggestions = {
    'medico-estetico': [
      'Tratamientos de Rejuvenecimiento Facial No Invasivo',
      'Beneficios del Ácido Hialurónico en Medicina Estética',
      'Tecnología HIFU para Lifting Facial Sin Cirugía',
      'Tratamientos de Manchas y Hiperpigmentación',
      'Medicina Estética Preventiva en Jóvenes',
      'Cuidados Post-Tratamiento en Medicina Estética',
      'Bioestimuladores de Colágeno: Guía Completa',
      'Tratamientos Faciales con Láser CO2',
      'Mesoterapia Facial: Beneficios y Aplicaciones',
      'Peeling Químico vs Tratamientos Láser'
    ],
    'tecnico': [
      'Parámetros Técnicos del Láser Nd:YAG en Depilación',
      'Protocolo de Seguridad en Radiofrecuencia Facial',
      'Tecnología IPL: Análisis de Espectros de Luz',
      'Calibración de Equipos de Alta Frecuencia',
      'Sistemas de Refrigeración en Equipos Estéticos',
      'Análisis Comparativo de Tecnologías LED',
      'Especificaciones Técnicas del Dermapen',
      'Protocolos de Mantenimiento de Equipos Láser',
      'Configuración de Parámetros en HIFU',
      'Sistemas de Control de Calidad en Equipos Médicos'
    ]
  };
  
  res.json({
    success: true,
    suggestions: suggestions
  });
});

// Sistema completo de generación de blogs con IA
app.post('/api/generate-blog', async (req, res) => {
  try {
    const { 
      blogType = 'medico-estetico', 
      topic, 
      manual = false 
    } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'El tema del blog es requerido'
      });
    }

    // Verificar OpenAI API Key
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'OPENAI_API_KEY no configurada',
        error: 'Variable de entorno faltante'
      });
    }

    // Validar tipo de blog
    if (!['medico-estetico', 'tecnico'].includes(blogType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tipo de blog inválido. Usar: medico-estetico o tecnico'
      });
    }

    const OpenAI = require('openai');
    
    // Configurar OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log(`🤖 Generando blog: "${topic}" (Tipo: ${blogType})`);

    // Prompts especializados (copiados del sistema de producción)
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

    const selectedPrompt = BLOG_PROMPTS[blogType];

    // Generar contenido con OpenAI
    const completion = await openai.chat.completions.create({
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
    const title = extractTitle(content);
    const slug = generateSlug(title);
    const excerpt = generateExcerpt(content);
    const tags = generateTags(content, blogType);

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

    console.log(`✅ Blog generado exitosamente: "${title}"`);

    res.json({
      success: true,
      blog: blogData,
      message: 'Blog generado exitosamente',
      stats: {
        words: content.split(' ').length,
        readTime: blogData.readTime,
        category: blogType
      }
    });

  } catch (error) {
    console.error('❌ Error generando blog:', error);

    let errorMessage = 'Error generando el blog';
    
    // Manejar errores específicos de OpenAI
    if (error.message.includes('API key')) {
      errorMessage = 'Error con la API key de OpenAI. Verifica que sea válida.';
    } else if (error.message.includes('quota')) {
      errorMessage = 'Límite de uso de OpenAI excedido. Verifica tu plan.';
    } else if (error.message.includes('network')) {
      errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      details: {
        type: error.constructor.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
});

// Funciones auxiliares (copiadas del sistema de producción)
function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Blog Sin Título';
}

function generateSlug(title) {
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

function generateExcerpt(content, maxLength = 150) {
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

function generateTags(content, category) {
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

// Resto de endpoints (guardar blog, desplegar, etc.) - simplificados
app.post('/api/save-blog', async (req, res) => {
  try {
    const { blogData } = req.body;
    
    if (!blogData || !blogData.slug) {
      return res.status(400).json({
        success: false,
        message: 'Datos del blog inválidos'
      });
    }

    const filename = `${blogData.slug}.json`;
    const filePath = path.join(blogsDir, filename);

    // Añadir metadatos de guardado local
    const finalBlogData = {
      ...blogData,
      savedAt: new Date().toISOString(),
      source: 'local-generator'
    };

    // Guardar archivo
    await fs.writeFile(filePath, JSON.stringify(finalBlogData, null, 2), 'utf8');

    console.log(`💾 Blog guardado: ${filename}`);

    res.json({
      success: true,
      message: 'Blog guardado exitosamente',
      slug: blogData.slug,
      path: filePath
    });

  } catch (error) {
    console.error('❌ Error guardando blog:', error);
    res.status(500).json({
      success: false,
      message: 'Error guardando el blog',
      error: error.message
    });
  }
});

// Desplegar blog con Git
app.post('/api/deploy-blog', async (req, res) => {
  try {
    const { blogSlug, commitMessage } = req.body;
    
    if (!blogSlug) {
      return res.status(400).json({
        success: false,
        message: 'El slug del blog es requerido'
      });
    }

    // Verificar que el archivo existe
    const blogPath = path.join(blogsDir, `${blogSlug}.json`);
    const exists = await fs.pathExists(blogPath);
    
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'El blog no existe'
      });
    }

    const simpleGit = require('simple-git');
    const git = simpleGit(projectRoot);

    // Añadir archivo
    const relativePath = path.relative(projectRoot, blogPath);
    await git.add(relativePath);

    // Commit
    const message = commitMessage || `📝 Nuevo blog generado localmente: ${blogSlug}`;
    const commitResult = await git.commit(message);

    // Push
    await git.push('origin', 'main');

    console.log(`🚀 Blog desplegado: ${blogSlug}`);

    res.json({
      success: true,
      message: 'Blog desplegado exitosamente',
      details: {
        slug: blogSlug,
        commit: commitResult.commit,
        commitMessage: message
      }
    });

  } catch (error) {
    console.error('❌ Error desplegando blog:', error);
    res.status(500).json({
      success: false,
      message: 'Error desplegando el blog',
      error: error.message
    });
  }
});

// Endpoints adicionales
app.get('/api/saved-blogs', async (req, res) => {
  try {
    const blogs = [];
    
    if (await fs.pathExists(blogsDir)) {
      const files = await fs.readdir(blogsDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(blogsDir, file);
            const content = await fs.readFile(filePath, 'utf8');
            const blogData = JSON.parse(content);
            blogs.push(blogData);
          } catch (err) {
            console.warn(`⚠️  Error leyendo ${file}:`, err.message);
          }
        }
      }
    }

    blogs.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    res.json({
      success: true,
      blogs: blogs
    });

  } catch (error) {
    console.error('❌ Error obteniendo blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo la lista de blogs',
      error: error.message
    });
  }
});

// Endpoint para subir imágenes - CORREGIDO
app.post('/api/upload-image', (req, res) => {
  console.log('📨 Petición recibida en /api/upload-image');
  
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('❌ Error de multer:', err);
      return res.status(400).json({
        success: false,
        message: 'Error procesando el archivo',
        error: err.message
      });
    }

    try {
      if (!req.file) {
        console.log('⚠️ No se recibió ningún archivo');
        return res.status(400).json({
          success: false,
          message: 'No se subió ningún archivo'
        });
      }

      const filename = req.file.filename;
      const imageUrl = `/uploads/${filename}`;

      console.log(`🖼️ Imagen subida exitosamente: ${filename}`);
      console.log(`📂 Ruta del archivo: ${req.file.path}`);
      console.log(`🔗 URL de la imagen: ${imageUrl}`);

      res.json({
        success: true,
        message: 'Imagen subida correctamente',
        imageUrl: imageUrl,
        filename: filename
      });

    } catch (error) {
      console.error('❌ Error procesando imagen:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando la imagen',
        error: error.message
      });
    }
  });
});

// Endpoint de validación de API key
app.get('/api/validate-api-key', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        valid: false,
        message: 'API key no configurada'
      });
    }

    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Hacer una llamada simple para validar
    await openai.models.list();

    res.json({
      valid: true,
      message: 'API key válida y funcional'
    });

  } catch (error) {
    res.json({
      valid: false,
      message: 'API key inválida o error de conexión',
      error: error.message
    });
  }
});

// Manejo de errores
app.use((error, req, res, next) => {
  console.error('Error del servidor:', error);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: error.message
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor iniciado correctamente en puerto ${PORT}`);
  console.log(`🔑 OpenAI configurado: ${process.env.OPENAI_API_KEY ? 'SÍ ✅' : 'NO ❌'}`);
  console.log(`📁 Directorio blogs: ${blogsDir}`);
  
  // Validar API key al iniciar
  if (process.env.OPENAI_API_KEY) {
    console.log(`🔐 API key válida: ${process.env.OPENAI_API_KEY.substring(0, 20)}...`);
  }
});

module.exports = app;