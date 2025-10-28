// server-production.js - Servidor con sistema de generación de producción
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const simpleGit = require('simple-git');
const OpenAI = require('openai');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = 3336;

console.log(`
  ╔════════════════════════════════════════╗
  ║        BIOSKIN BLOG GENERATOR          ║
  ║          VERSIÓN PRODUCCIÓN            ║
  ╠════════════════════════════════════════╣
  ║  🌐 Servidor: http://localhost:${PORT}     ║
  ║  📝 Generación completa con IA         ║
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

// Configuración de multer para subida de imágenes organizadas por blog
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('🔍 Determinando destino para subida de imagen...');
    console.log('📋 req.body:', req.body);
    
    // Obtener el slug del blog desde el formulario
    const blogSlug = req.body.blogSlug || 'temporal';
    console.log(`📂 Slug detectado: ${blogSlug}`);
    
    const blogImagesDir = path.join(projectRoot, 'public', 'images', 'blog', blogSlug);
    console.log(`📁 Directorio de destino: ${blogImagesDir}`);
    
    // Crear directorio de forma síncrona para multer
    fs.ensureDirSync(blogImagesDir);
    console.log(`✅ Directorio creado/verificado: ${blogImagesDir}`);
    
    cb(null, blogImagesDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const originalName = path.basename(file.originalname, extension);
    const safeFilename = originalName.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const finalFilename = `${safeFilename}-${timestamp}${extension}`;
    console.log(`📷 Nombre de archivo generado: ${finalFilename}`);
    cb(null, finalFilename);
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

// Verificar directorios y configuración
const projectRoot = path.join(__dirname, '../');
const blogsDir = path.join(projectRoot, 'src/data/blogs');

fs.ensureDir(blogsDir).then(() => {
  console.log('📁 Directorios de blogs verificados');
}).catch(err => {
  console.error('❌ Error creando directorios:', err.message);
});

// Verificar OpenAI API Key
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY no configurada');
  console.log('⚠️  Por favor, configura tu API key en el archivo .env');
} else {
  console.log('✅ OpenAI API Key configurada');
}

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// SISTEMA DE GENERACIÓN COMPLETO (copiado de producción)
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

// Funciones auxiliares
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

function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Blog Sin Título';
}

function generateExcerpt(content, maxLength = 150) {
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

// Generar blog con IA (SISTEMA COMPLETO DE PRODUCCIÓN)
app.post('/api/generate-blog', async (req, res) => {
  try {
    console.log('🤖 Iniciando generación de blog...');
    console.log('📊 Request body:', JSON.stringify(req.body, null, 2));

    // Verificar API Key
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'OPENAI_API_KEY no configurada',
        error: 'Variable de entorno faltante',
        endpoint: '/api/generate-blog'
      });
    }

    const { 
      blogType = 'medico-estetico', 
      topic = 'Tratamientos de medicina estética',
      manual = false 
    } = req.body || {};

    console.log(`📝 Generando blog - Tipo: ${blogType}, Tema: ${topic}`);

    // Validar tipo de blog
    if (!['medico-estetico', 'tecnico'].includes(blogType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tipo de blog inválido. Usar: medico-estetico o tecnico'
      });
    }

    // Obtener prompts
    const selectedPrompts = BLOG_PROMPTS[blogType];
    console.log('✅ Prompts seleccionados');

    // Generar contenido con OpenAI
    console.log('🔄 Llamando a OpenAI GPT-4...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: selectedPrompts.systemPrompt 
        },
        { 
          role: "user", 
          content: selectedPrompts.userPrompt(topic) 
        }
      ],
      max_tokens: 3000,
      temperature: 0.7
    });

    console.log('✅ Respuesta recibida de OpenAI');

    const content = completion.choices[0].message.content;
    console.log(`📏 Contenido generado: ${content.length} caracteres`);

    // Procesar el contenido generado
    const title = extractTitle(content);
    const slug = generateSlug(title);
    const excerpt = generateExcerpt(content);
    const tags = generateTags(content, blogType);

    console.log(`📌 Título: ${title}`);
    console.log(`🔗 Slug: ${slug}`);

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

    console.log('✅ Blog generado exitosamente');

    return res.json({
      success: true,
      blog: blogData,
      message: 'Blog generado exitosamente',
      stats: {
        words: content.split(' ').length,
        readTime: blogData.readTime,
        category: blogType,
        tokensUsed: completion.usage?.total_tokens || 0
      }
    });

  } catch (error) {
    console.error('❌ Error generando blog:', error);
    
    // Diagnóstico específico del error
    let errorMessage = 'Error generando el blog';
    let errorDetails = error.message;

    if (error.code === 'invalid_api_key') {
      errorMessage = 'API Key de OpenAI inválida';
      errorDetails = 'Verifica que tu API key sea correcta y tenga fondos disponibles';
    } else if (error.code === 'insufficient_quota') {
      errorMessage = 'Cuota de OpenAI agotada';
      errorDetails = 'Tu cuenta de OpenAI ha alcanzado el límite de uso';
    } else if (error.code === 'rate_limit_exceeded') {
      errorMessage = 'Límite de velocidad excedido';
      errorDetails = 'Demasiadas solicitudes muy rápido, espera un momento';
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: errorDetails,
      code: error.code || 'unknown_error',
      details: error.toString()
    });
  }
});

// Función para mover imágenes temporales al directorio correcto
async function moveTemporalImages(blogSlug) {
  try {
    const temporalDir = path.join(projectRoot, 'public', 'images', 'blog', 'temporal');
    const blogImagesDir = path.join(projectRoot, 'public', 'images', 'blog', blogSlug);
    
    if (await fs.pathExists(temporalDir)) {
      const temporalFiles = await fs.readdir(temporalDir);
      
      if (temporalFiles.length > 0) {
        console.log(`🔄 Moviendo ${temporalFiles.length} imágenes temporales a ${blogSlug}`);
        
        await fs.ensureDir(blogImagesDir);
        
        for (const file of temporalFiles) {
          const sourcePath = path.join(temporalDir, file);
          const targetPath = path.join(blogImagesDir, file);
          
          try {
            await fs.move(sourcePath, targetPath);
            console.log(`✅ Movida: ${file} -> ${blogSlug}/`);
          } catch (moveError) {
            console.warn(`⚠️ Error moviendo ${file}:`, moveError.message);
          }
        }
        
        // Intentar eliminar directorio temporal si está vacío
        try {
          const remainingFiles = await fs.readdir(temporalDir);
          if (remainingFiles.length === 0) {
            await fs.remove(temporalDir);
            console.log('🗑️ Directorio temporal limpiado');
          }
        } catch (cleanupError) {
          console.log('⚠️ No se pudo limpiar directorio temporal:', cleanupError.message);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error moviendo imágenes temporales:', error);
  }
}

// Guardar blog con estructura organizada
app.post('/api/save-blog', async (req, res) => {
  try {
    const { blogData } = req.body;
    
    if (!blogData || !blogData.slug) {
      return res.status(400).json({
        success: false,
        message: 'Datos del blog inválidos'
      });
    }

    // Crear estructura de directorios para el blog
    const blogSlug = blogData.slug;
    const blogDir = path.join(blogsDir, blogSlug);
    const blogImagesDir = path.join(projectRoot, 'public', 'images', 'blog', blogSlug);

    // Asegurar que existen los directorios
    await fs.ensureDir(blogDir);
    await fs.ensureDir(blogImagesDir);

    // Mover imágenes temporales si existen
    await moveTemporalImages(blogSlug);

    // Paths de archivos
    const blogFilePath = path.join(blogDir, 'index.json');
    const metadataFilePath = path.join(blogDir, 'metadata.json');

    // Añadir metadatos de guardado
    const finalBlogData = {
      ...blogData,
      savedAt: new Date().toISOString(),
      source: 'local-generator',
      structure: 'organized',
      paths: {
        blog: `src/data/blogs/${blogSlug}/index.json`,
        images: `public/images/blog/${blogSlug}/`,
        metadata: `src/data/blogs/${blogSlug}/metadata.json`
      }
    };

    // Crear metadatos separados para facilitar la gestión
    const metadata = {
      id: finalBlogData.id,
      title: finalBlogData.title,
      slug: finalBlogData.slug,
      category: finalBlogData.category,
      author: finalBlogData.author,
      publishedAt: finalBlogData.publishedAt,
      savedAt: finalBlogData.savedAt,
      readTime: finalBlogData.readTime,
      tags: finalBlogData.tags,
      featured: finalBlogData.featured || false,
      source: finalBlogData.source,
      structure: finalBlogData.structure,
      paths: finalBlogData.paths,
      images: finalBlogData.images || [],
      status: 'draft' // Estados: draft, ready, published
    };

    // Guardar archivos
    await fs.writeFile(blogFilePath, JSON.stringify(finalBlogData, null, 2), 'utf8');
    await fs.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2), 'utf8');

    // Actualizar índice de blogs
    await updateBlogsIndex();

    console.log(`💾 Blog guardado con estructura organizada: ${blogSlug}`);
    console.log(`📁 Directorio: ${blogDir}`);
    console.log(`🖼️ Imágenes: ${blogImagesDir}`);

    res.json({
      success: true,
      message: 'Blog guardado exitosamente con estructura organizada',
      slug: blogSlug,
      paths: {
        blog: blogFilePath,
        images: blogImagesDir,
        metadata: metadataFilePath
      },
      structure: 'organized'
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

// Función para actualizar el índice de blogs
async function updateBlogsIndex() {
  try {
    const indexPath = path.join(blogsDir, 'index.json');
    const blogs = [];
    
    // Leer todos los blogs organizados
    if (await fs.pathExists(blogsDir)) {
      const entries = await fs.readdir(blogsDir);
      
      for (const entry of entries) {
        const entryPath = path.join(blogsDir, entry);
        const stat = await fs.stat(entryPath);
        
        if (stat.isDirectory()) {
          // Es un blog organizado
          const metadataPath = path.join(entryPath, 'metadata.json');
          if (await fs.pathExists(metadataPath)) {
            try {
              const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
              blogs.push(metadata);
            } catch (err) {
              console.warn(`⚠️ Error leyendo metadata de ${entry}:`, err.message);
            }
          }
        } else if (entry.endsWith('.json') && entry !== 'index.json') {
          // Es un blog legacy (archivo individual)
          try {
            const content = await fs.readFile(entryPath, 'utf8');
            const blogData = JSON.parse(content);
            blogs.push({
              ...blogData,
              structure: 'legacy',
              source: blogData.source || 'legacy'
            });
          } catch (err) {
            console.warn(`⚠️ Error leyendo blog legacy ${entry}:`, err.message);
          }
        }
      }
    }

    // Ordenar por fecha de publicación
    blogs.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // Guardar índice actualizado
    const indexData = {
      lastUpdated: new Date().toISOString(),
      total: blogs.length,
      organized: blogs.filter(b => b.structure === 'organized').length,
      legacy: blogs.filter(b => b.structure === 'legacy').length,
      blogs: blogs
    };

    await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2), 'utf8');
    console.log(`📇 Índice de blogs actualizado: ${blogs.length} blogs`);

  } catch (error) {
    console.error('❌ Error actualizando índice de blogs:', error);
  }
}

// Desplegar blog con estructura organizada
app.post('/api/deploy-blog', async (req, res) => {
  try {
    const { blogSlug, commitMessage } = req.body;
    
    if (!blogSlug) {
      return res.status(400).json({
        success: false,
        message: 'El slug del blog es requerido'
      });
    }

    let blogPath, blogData;

    // Buscar en estructura organizada
    const organizedPath = path.join(blogsDir, blogSlug, 'index.json');
    if (await fs.pathExists(organizedPath)) {
      blogPath = organizedPath;
      const content = await fs.readFile(organizedPath, 'utf8');
      blogData = JSON.parse(content);
    } else {
      // Buscar en archivos legacy
      const legacyPath = path.join(blogsDir, `${blogSlug}.json`);
      if (await fs.pathExists(legacyPath)) {
        blogPath = legacyPath;
        const content = await fs.readFile(legacyPath, 'utf8');
        blogData = JSON.parse(content);
      } else {
        return res.status(404).json({
          success: false,
          message: 'El blog no existe'
        });
      }
    }

    // Despliegue con Git
    const git = simpleGit(projectRoot);

    console.log(`🔄 Iniciando despliegue para blog: ${blogSlug}`);

    // Añadir todos los archivos del blog
    if (blogData.structure === 'organized') {
      // Blog organizado: añadir directorio completo
      const relativeBlogDir = path.relative(projectRoot, path.dirname(blogPath)).replace(/\\/g, '/');
      console.log(`📁 Añadiendo directorio del blog: ${relativeBlogDir}`);
      await git.add(`${relativeBlogDir}/`);
      
      // También añadir imágenes si existen
      const blogImagesDir = path.join(projectRoot, 'public', 'images', 'blog', blogSlug);
      if (await fs.pathExists(blogImagesDir)) {
        // Verificar que hay archivos en el directorio
        const imageFiles = await fs.readdir(blogImagesDir);
        if (imageFiles.length > 0) {
          const relativeImagesDir = path.relative(projectRoot, blogImagesDir).replace(/\\/g, '/');
          console.log(`🖼️ Añadiendo imágenes: ${relativeImagesDir}/ (${imageFiles.length} archivos)`);
          await git.add(`${relativeImagesDir}/`);
        } else {
          console.log(`⚠️ Directorio de imágenes vacío: ${blogImagesDir}`);
        }
      } else {
        console.log(`⚠️ Directorio de imágenes no existe: ${blogImagesDir}`);
      }
    } else {
      // Blog legacy: añadir solo el archivo
      const relativePath = path.relative(projectRoot, blogPath).replace(/\\/g, '/');
      console.log(`📄 Añadiendo archivo legacy: ${relativePath}`);
      await git.add(relativePath);
    }

    // Añadir índice actualizado
    const indexPath = path.join(blogsDir, 'index.json');
    if (await fs.pathExists(indexPath)) {
      const relativeIndexPath = path.relative(projectRoot, indexPath).replace(/\\/g, '/');
      console.log(`📇 Añadiendo índice: ${relativeIndexPath}`);
      await git.add(relativeIndexPath);
    }

    // Commit
    const message = commitMessage || `📝 Nuevo blog organizado: ${blogData.title}`;
    const commitResult = await git.commit(message);

    // Push
    await git.push('origin', 'main');

    // Actualizar estado del blog a publicado
    if (blogData.structure === 'organized') {
      const metadataPath = path.join(path.dirname(blogPath), 'metadata.json');
      if (await fs.pathExists(metadataPath)) {
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
        metadata.status = 'published';
        metadata.publishedAt = new Date().toISOString();
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
      }
    }

    console.log(`🚀 Blog desplegado con estructura organizada: ${blogSlug}`);

    res.json({
      success: true,
      message: 'Blog desplegado exitosamente',
      details: {
        slug: blogSlug,
        title: blogData.title,
        commit: commitResult.commit,
        commitMessage: message,
        structure: blogData.structure || 'legacy',
        imagesIncluded: blogData.structure === 'organized'
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

// Lista de blogs guardados con estructura mejorada
app.get('/api/saved-blogs', async (req, res) => {
  try {
    const indexPath = path.join(blogsDir, 'index.json');
    
    if (await fs.pathExists(indexPath)) {
      // Si existe el índice, usarlo
      const indexContent = await fs.readFile(indexPath, 'utf8');
      const indexData = JSON.parse(indexContent);
      
      res.json({
        success: true,
        blogs: indexData.blogs,
        metadata: {
          total: indexData.total,
          organized: indexData.organized,
          legacy: indexData.legacy,
          lastUpdated: indexData.lastUpdated
        }
      });
    } else {
      // Si no existe índice, crear uno nuevo escaneando directorios
      await updateBlogsIndex();
      
      // Leer el índice recién creado
      if (await fs.pathExists(indexPath)) {
        const indexContent = await fs.readFile(indexPath, 'utf8');
        const indexData = JSON.parse(indexContent);
        
        res.json({
          success: true,
          blogs: indexData.blogs,
          metadata: {
            total: indexData.total,
            organized: indexData.organized,
            legacy: indexData.legacy,
            lastUpdated: indexData.lastUpdated
          }
        });
      } else {
        res.json({
          success: true,
          blogs: [],
          metadata: {
            total: 0,
            organized: 0,
            legacy: 0,
            lastUpdated: new Date().toISOString()
          }
        });
      }
    }

  } catch (error) {
    console.error('❌ Error obteniendo blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo la lista de blogs',
      error: error.message
    });
  }
});

// Endpoint para obtener un blog específico
app.get('/api/blog/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Buscar primero en estructura organizada
    const organizedPath = path.join(blogsDir, slug, 'index.json');
    if (await fs.pathExists(organizedPath)) {
      const content = await fs.readFile(organizedPath, 'utf8');
      const blogData = JSON.parse(content);
      
      // También obtener metadata
      const metadataPath = path.join(blogsDir, slug, 'metadata.json');
      let metadata = {};
      if (await fs.pathExists(metadataPath)) {
        const metadataContent = await fs.readFile(metadataPath, 'utf8');
        metadata = JSON.parse(metadataContent);
      }
      
      return res.json({
        success: true,
        blog: blogData,
        metadata: metadata,
        structure: 'organized'
      });
    }
    
    // Si no está en estructura organizada, buscar en archivos legacy
    const legacyPath = path.join(blogsDir, `${slug}.json`);
    if (await fs.pathExists(legacyPath)) {
      const content = await fs.readFile(legacyPath, 'utf8');
      const blogData = JSON.parse(content);
      
      return res.json({
        success: true,
        blog: blogData,
        metadata: blogData,
        structure: 'legacy'
      });
    }
    
    // Blog no encontrado
    res.status(404).json({
      success: false,
      message: 'Blog no encontrado',
      slug: slug
    });

  } catch (error) {
    console.error('❌ Error obteniendo blog:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo el blog',
      error: error.message
    });
  }
});

// Endpoint para subir imágenes organizadas por blog
app.post('/api/upload-image', (req, res) => {
  console.log('📨 Petición recibida en /api/upload-image');
  console.log('📋 Headers:', req.headers);
  
  upload.single('image')(req, res, async (err) => {
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
        console.log('📋 req.body completo:', req.body);
        return res.status(400).json({
          success: false,
          message: 'No se subió ningún archivo'
        });
      }

      const blogSlug = req.body.blogSlug || 'temporal';
      const filename = req.file.filename;
      const imageUrl = `/images/blog/${blogSlug}/${filename}`;

      console.log(`🖼️ Imagen subida exitosamente: ${filename}`);
      console.log(`📂 Blog slug usado: ${blogSlug}`);
      console.log(`📂 Ruta del archivo físico: ${req.file.path}`);
      console.log(`🔗 URL de la imagen: ${imageUrl}`);

      // Verificar que el archivo realmente se guardó
      if (await fs.pathExists(req.file.path)) {
        console.log(`✅ Archivo confirmado en: ${req.file.path}`);
      } else {
        console.error(`❌ Archivo NO encontrado en: ${req.file.path}`);
      }

      // Si el blog existe, actualizar su lista de imágenes
      if (blogSlug !== 'temporal') {
        await updateBlogImages(blogSlug, imageUrl, filename);
      } else {
        console.log('⚠️ Imagen subida a carpeta temporal porque no se proporcionó blogSlug válido');
      }

      res.json({
        success: true,
        message: 'Imagen subida correctamente',
        imageUrl: imageUrl,
        filename: filename,
        blogSlug: blogSlug,
        fullPath: req.file.path,
        debug: {
          originalBlogSlug: req.body.blogSlug,
          usedBlogSlug: blogSlug,
          destination: req.file.destination
        }
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

// Función para actualizar las imágenes de un blog
async function updateBlogImages(blogSlug, imageUrl, filename) {
  try {
    const blogDir = path.join(blogsDir, blogSlug);
    const metadataPath = path.join(blogDir, 'metadata.json');
    
    if (await fs.pathExists(metadataPath)) {
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
      
      // Añadir imagen a la lista
      if (!metadata.images) {
        metadata.images = [];
      }
      
      const imageInfo = {
        url: imageUrl,
        filename: filename,
        uploadedAt: new Date().toISOString(),
        type: determineImageType(filename)
      };
      
      metadata.images.push(imageInfo);
      
      // Guardar metadata actualizado
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
      
      console.log(`📸 Imagen añadida al blog ${blogSlug}: ${filename}`);
    }
  } catch (error) {
    console.error('❌ Error actualizando imágenes del blog:', error);
  }
}

// Función para determinar el tipo de imagen
function determineImageType(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('principal') || lower.includes('main') || lower.includes('hero')) {
    return 'principal';
  } else if (lower.includes('conclusion') || lower.includes('final') || lower.includes('end')) {
    return 'conclusion';
  } else if (lower.includes('antes') || lower.includes('before')) {
    return 'antes';
  } else if (lower.includes('despues') || lower.includes('after')) {
    return 'despues';
  } else {
    return 'contenido';
  }
}

// Validar API Key
app.get('/api/validate-openai', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        valid: false,
        message: 'API Key no configurada'
      });
    }

    // Hacer una llamada simple para validar
    const response = await openai.models.list();

    res.json({
      valid: true,
      message: 'API Key válida',
      models: response.data.length
    });

  } catch (error) {
    console.error('❌ Error validando API Key:', error);
    res.json({
      valid: false,
      message: 'API Key inválida o error de conexión',
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
  console.log(`🔑 OpenAI configurado: ${process.env.OPENAI_API_KEY ? 'SÍ' : 'NO'}`);
  console.log(`📁 Directorio blogs: ${blogsDir}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
});

module.exports = app;