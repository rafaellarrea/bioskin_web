const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const app = express();
const PORT = 3335;

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'public', 'images', 'blog');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '-');
    cb(null, `blog-${timestamp}-${cleanName}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

// Middleware de logging
app.use((req, res, next) => {
    console.log(`📞 ${new Date().toISOString()} - ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`📦 Body:`, req.body);
    }
    next();
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/public', express.static(path.join(__dirname, '..', 'public')));
app.use('/interface', express.static(path.join(__dirname, 'public')));

// Servir la interfaz principal (ahora la versión simple)
app.get('/', (req, res) => {
  console.log('🏠 Sirviendo interfaz principal (versión simple)');
  res.sendFile(path.join(__dirname, 'public', 'index-simple.html'));
});

// Servir versión original para referencia
app.get('/original', (req, res) => {
  console.log('🔧 Sirviendo versión original');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Generar blog con IA
app.post('/api/generate-blog', async (req, res) => {
  console.log('🚀 Nueva petición de generación de blog recibida');
  console.log('📝 Body recibido:', req.body);
  
  try {
    const { category, customTopic } = req.body;
    console.log(`📂 Categoría: "${category}"`);
    console.log(`🎯 Tema personalizado: "${customTopic || 'No especificado'}"`);
    
    if (!category) {
      console.log('❌ Error: Categoría no proporcionada');
      return res.status(400).json({ error: 'Categoría requerida' });
    }

    // Llamar a la API de generación de Vercel
    const payload = {
      category: category,
      ...(customTopic && { customTopic })
    };

    console.log('📤 Payload preparado:', payload);

    // Intentar diferentes endpoints de Vercel
    const apiUrls = [
      'https://saludbioskin.vercel.app/api/ai-blog/generate', // ✅ NUEVO: Endpoint simplificado (sin dependencias locales)
      'https://saludbioskin.vercel.app/api/ai-blog/generate-production',
      'https://saludbioskin.vercel.app/api/blogs?action=generate'
    ];
    
    let lastError = null;
    
    for (const apiUrl of apiUrls) {
      console.log('🔄 Intentando URL:', apiUrl);
      
      try {
    console.log('🌐 Llamando a:', apiUrl);

    let fetch;
    try {
      fetch = (await import('node-fetch')).default;
      console.log('📦 node-fetch importado correctamente');
    } catch (importError) {
      console.log('❌ Error importando node-fetch:', importError);
      throw new Error('No se pudo cargar node-fetch. Ejecuta: npm install node-fetch');
    }

        console.log('📡 Enviando petición a:', apiUrl);
        console.log('📤 Payload:', JSON.stringify(payload, null, 2));
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        console.log(`📥 Respuesta de ${apiUrl}: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Resultado exitoso de Vercel:', result);
          return res.json(result);
        } else {
          const errorText = await response.text();
          console.log(`❌ Error en ${apiUrl}:`, errorText);
          lastError = new Error(`${response.status} - ${errorText}`);
          continue; // Intentar siguiente URL
        }
        
      } catch (fetchError) {
        console.log(`❌ Error de conexión con ${apiUrl}:`, fetchError.message);
        lastError = fetchError;
        continue; // Intentar siguiente URL
      }
    }
    
    // Si llegamos aquí, todas las URLs fallaron
    throw new Error(`Todos los endpoints fallaron. Último error: ${lastError.message}`);

  } catch (error) {
    console.error('❌ Error completo generando blog:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Error generando blog', 
      details: error.message,
      stack: error.stack 
    });
  }
});

// API: Subir imagen
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió archivo' });
    }

    const { blogSlug } = req.body;
    
    if (!blogSlug) {
      return res.status(400).json({ error: 'blogSlug requerido' });
    }

    // ✅ CORREGIDO: Usar estructura correcta /images/blog/[slug]/[filename]
    const blogImagesDir = path.join(process.cwd(), 'public', 'images', 'blog', blogSlug);
    
    // Crear directorio si no existe
    if (!fs.existsSync(blogImagesDir)) {
      fs.mkdirSync(blogImagesDir, { recursive: true });
    }
    
    // Generar nombre único para la imagen
    const timestamp = Date.now();
    const extension = path.extname(req.file.originalname);
    const baseName = path.basename(req.file.originalname, extension).toLowerCase().replace(/[^a-z0-9]/g, '');
    const newFileName = `${baseName}-${timestamp}${extension}`;
    
    // Mover archivo a la ubicación correcta
    const finalPath = path.join(blogImagesDir, newFileName);
    fs.renameSync(req.file.path, finalPath);
    
    // URL final de la imagen
    const imageUrl = `/images/blog/${blogSlug}/${newFileName}`;
    
    console.log(`📸 Imagen guardada: ${imageUrl}`);
    
    res.json({
      success: true,
      imageUrl,
      filename: newFileName,
      blogSlug,
      path: finalPath,
      id: timestamp
    });

  } catch (error) {
    console.error('Error subiendo imagen:', error);
    res.status(500).json({ 
      error: 'Error subiendo imagen', 
      details: error.message 
    });
  }
});

// ✅ NUEVO: API para generar sugerencias de temas con IA
app.post('/api/suggest-topics', async (req, res) => {
  console.log('💡 Generando sugerencias de temas con IA...');
  
  try {
    const { category = 'medico-estetico' } = req.body;
    
    // Temas existentes para entrenamiento de la IA
    const existingTopics = [
      'Radiofrecuencia Bipolar: Remodelación Facial de Alta Eficacia en BIOSKIN',
      'Mesoterapia Facial: Un Tratamiento Estrella para una Piel Radiante', 
      'Peeling Químico vs Tratamientos Láser: ¿Cuál es la mejor opción para tu piel?'
    ];
    
    // Llamar a la API de IA de Vercel para generar sugerencias
    const apiUrls = [
      'https://saludbioskin.vercel.app/api/ai-blog/generate',
      'https://saludbioskin.vercel.app/api/ai-blog/generate-production'
    ];
    
    const payload = {
      category,
      generateSuggestions: true,
      existingTopics,
      requestType: 'topic_suggestions'
    };
    
    let lastError = null;
    
    for (const apiUrl of apiUrls) {
      try {
        console.log(`🎯 Probando sugerencias en: ${apiUrl}`);
        
        const fetch = (await import('node-fetch')).default;
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.suggestions) {
            console.log('✅ Sugerencias generadas exitosamente');
            return res.json({
              success: true,
              suggestions: result.suggestions,
              category,
              source: apiUrl
            });
          }
        } else {
          lastError = `HTTP ${response.status}`;
        }
        
      } catch (error) {
        console.error(`❌ Error en ${apiUrl}:`, error);
        lastError = error.message;
      }
    }
    
    // Fallback: generar sugerencias locales
    console.log('🔄 Generando sugerencias locales como fallback');
    
    const localSuggestions = generateLocalSuggestions(category);
    
    res.json({
      success: true,
      suggestions: localSuggestions,
      category,
      source: 'local-fallback',
      note: 'Sugerencias generadas localmente debido a error en IA'
    });
    
  } catch (error) {
    console.error('❌ Error generando sugerencias:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Función para generar sugerencias locales como fallback
function generateLocalSuggestions(category) {
  const medicoEsteticoSuggestions = [
    'HydraFacial: Limpieza Profunda y Hidratación Instantánea',
    'Microagujas con PRP: Regeneración Natural de la Piel',
    'Carboxiterapia Facial: Oxigenación y Rejuvenecimiento',
    'Ultrasonido Focalizados HIFU: Lifting Sin Cirugía',
    'Plasma Rico en Plaquetas: Medicina Regenerativa Avanzada'
  ];
  
  const tecnicoSuggestions = [
    'Tecnología IPL vs Láser Diodo: Análisis Comparativo',
    'Sistemas de Radiofrecuencia Multipolar: Innovación Técnica',
    'Crioterapia Controlada: Principios Físicos y Aplicaciones',
    'Cavitación Ultrasónica: Fundamentos y Protocolos',
    'Diatermia Capacitiva: Técnica y Parámetros Óptimos'
  ];
  
  const suggestions = category === 'tecnico' ? tecnicoSuggestions : medicoEsteticoSuggestions;
  
  // Mezclar y seleccionar 5 sugerencias aleatorias
  const shuffled = suggestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 5);
}

// API: Guardar blog y hacer deploy
app.post('/api/save-and-deploy', async (req, res) => {
  console.log('💾 Iniciando guardado de blog...');
  console.log('📝 Datos recibidos:', JSON.stringify(req.body, null, 2));
  
  try {
    const { blogData, images } = req.body;
    
    if (!blogData || !blogData.slug) {
      return res.status(400).json({ error: 'Datos de blog inválidos' });
    }

    console.log(`📁 Creando blog: ${blogData.title}`);
    console.log(`📂 Slug: ${blogData.slug}`);

    // 1. Crear directorio del blog
    const blogDir = path.join(__dirname, '..', 'src', 'data', 'blogs', blogData.slug);
    console.log('📁 Directorio del blog:', blogDir);
    await fs.mkdir(blogDir, { recursive: true });

    // 2. Crear estructura del blog siguiendo el patrón existente
    const blogId = `blog-${Date.now()}`;
    const currentDate = new Date().toISOString();
    
    const structuredBlog = {
      id: blogId,
      title: blogData.title,
      slug: blogData.slug,
      excerpt: blogData.excerpt,
      content: blogData.content,
      category: blogData.category,
      author: blogData.author || 'BIOSKIN Médico',
      publishedAt: currentDate,
      readTime: blogData.readTime,
      tags: blogData.tags,
      image: "", // Se actualizará si hay imágenes
      imagenPrincipal: "",
      imagenConclusion: "",
      featured: false,
      source: "local-generator",
      images: [],
      savedAt: currentDate,
      structure: "organized",
      paths: {
        blog: `src/data/blogs/${blogData.slug}/index.json`,
        images: `public/images/blog/${blogData.slug}/`,
        metadata: `src/data/blogs/${blogData.slug}/metadata.json`
      }
    };

    // 3. Manejar imágenes si existen
    if (images && images.length > 0) {
      const publicImagesDir = path.join(__dirname, '..', 'public', 'images', 'blog', blogData.slug);
      console.log('🖼️  Directorio de imágenes:', publicImagesDir);
      await fs.mkdir(publicImagesDir, { recursive: true });

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const sourcePath = path.join(__dirname, '..', 'public', image.path);
        const destPath = path.join(publicImagesDir, image.filename);
        
        try {
          await fs.copyFile(sourcePath, destPath);
          
          const imageUrl = `/images/blog/${blogData.slug}/${image.filename}`;
          const imageData = {
            url: imageUrl,
            name: image.originalName || image.filename,
            id: Date.now() + i,
            blogSlug: blogData.slug,
            isOrganized: true
          };
          
          structuredBlog.images.push(imageData);
          
          // La primera imagen es la principal
          if (i === 0) {
            structuredBlog.image = imageUrl;
            structuredBlog.imagenPrincipal = imageUrl;
          }
          
          console.log(`✅ Imagen copiada: ${image.filename}`);
        } catch (copyError) {
          console.log(`⚠️  No se pudo copiar imagen ${image.filename}:`, copyError.message);
        }
      }
    }

    // 4. Guardar archivo index.json del blog
    const blogJsonPath = path.join(blogDir, 'index.json');
    await fs.writeFile(blogJsonPath, JSON.stringify(structuredBlog, null, 2));
    console.log('✅ Blog guardado en:', blogJsonPath);

    // 5. Crear metadata.json
    const metadataPath = path.join(blogDir, 'metadata.json');
    const metadata = {
      createdAt: currentDate,
      updatedAt: currentDate,
      version: "1.0",
      structure: "organized"
    };
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    // 6. Actualizar index.json principal
    const indexPath = path.join(__dirname, '..', 'src', 'data', 'blogs', 'index.json');
    let indexData = { 
      lastUpdated: currentDate,
      total: 0,
      organized: 0,
      legacy: 0,
      blogs: [] 
    };
    
    try {
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      indexData = JSON.parse(indexContent);
    } catch (error) {
      console.log('📝 Creando nuevo index.json');
    }

    // Crear entrada para el índice
    const blogSummary = {
      id: blogId,
      title: blogData.title,
      slug: blogData.slug,
      category: blogData.category,
      author: structuredBlog.author,
      publishedAt: currentDate,
      savedAt: currentDate,
      readTime: blogData.readTime,
      tags: blogData.tags,
      featured: false,
      source: "local-generator",
      structure: "organized",
      paths: structuredBlog.paths,
      images: structuredBlog.images,
      status: "draft"
    };

    // Agregar al inicio de la lista
    indexData.blogs.unshift(blogSummary);
    indexData.total = indexData.blogs.length;
    indexData.organized = indexData.blogs.filter(blog => blog.structure === "organized").length;
    indexData.lastUpdated = currentDate;

    await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2));
    console.log('✅ Index.json actualizado');

    // 7. Git add, commit y push
    console.log('🚀 Iniciando deploy automático...');
    try {
      const projectRoot = path.join(__dirname, '..');
      
      console.log('📋 Ejecutando git add...');
      await execAsync('git add .', { cwd: projectRoot });
      
      console.log('📝 Ejecutando git commit...');
      await execAsync(`git commit -m "Nuevo blog: ${blogData.title}"`, { cwd: projectRoot });
      
      console.log('🚀 Ejecutando git push...');
      await execAsync('git push origin main', { cwd: projectRoot });
      
      console.log('✅ Deploy automático completado exitosamente');
    } catch (gitError) {
      console.error('⚠️  Error en git (blog guardado correctamente):', gitError.message);
      // No fallar si git falla, el blog se guardó correctamente
    }

    res.json({
      success: true,
      message: 'Blog guardado y desplegado exitosamente',
      blog: structuredBlog,
      paths: {
        blogFile: blogJsonPath,
        imagesDir: structuredBlog.paths.images,
        indexFile: indexPath
      }
    });

  } catch (error) {
    console.error('❌ Error completo guardando blog:', error);
    res.status(500).json({ 
      error: 'Error guardando blog', 
      details: error.message,
      stack: error.stack 
    });
  }
});

// API: Obtener blogs existentes
app.get('/api/blogs', async (req, res) => {
  try {
    const indexPath = path.join(__dirname, '..', 'src', 'data', 'blogs', 'index.json');
    
    try {
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const indexData = JSON.parse(indexContent);
      res.json(indexData);
    } catch (error) {
      res.json({ blogs: [] });
    }
    
  } catch (error) {
    console.error('Error obteniendo blogs:', error);
    res.status(500).json({ 
      error: 'Error obteniendo blogs', 
      details: error.message 
    });
  }
});

// API: Health check
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check solicitado');
  res.json({ 
    status: 'ok', 
    server: 'Blog Generator Interface',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// API: Test de conexión
app.get('/api/test', (req, res) => {
  console.log('🧪 Test endpoint llamado');
  res.json({ 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// API: Diagnosticar APIs de Vercel
app.get('/api/diagnose-vercel', async (req, res) => {
  console.log('🔍 Iniciando diagnóstico de APIs de Vercel...');
  
  const endpoints = [
    'https://saludbioskin.vercel.app/api/ai-blog/generate', // ✅ PRIORIDAD: Endpoint simplificado
    'https://saludbioskin.vercel.app/api/ai-blog/generate-production',
    'https://saludbioskin.vercel.app/api/blogs?action=generate',
    'https://saludbioskin.vercel.app/api/blogs',
    'https://saludbioskin.vercel.app/api/health'
  ];
  
  const results = [];
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    for (const endpoint of endpoints) {
      console.log(`🔍 Probando: ${endpoint}`);
      
      try {
        // Primero probar GET
        const getResponse = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'User-Agent': 'BIOSKIN-Blog-Generator/1.0'
          }
        });
        
        const getResult = {
          url: endpoint,
          method: 'GET',
          status: getResponse.status,
          statusText: getResponse.statusText,
          ok: getResponse.ok,
          contentType: getResponse.headers.get('content-type'),
          body: null
        };
        
        if (getResponse.ok) {
          try {
            getResult.body = await getResponse.text();
          } catch (e) {
            getResult.body = 'No se pudo leer el body';
          }
        }
        
        results.push(getResult);
        
        // Si es un endpoint de generación, probar POST también
        if (endpoint.includes('generate') || endpoint.includes('blogs')) {
          console.log(`🔍 Probando POST: ${endpoint}`);
          
          const postResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'BIOSKIN-Blog-Generator/1.0'
            },
            body: JSON.stringify({
              category: 'medico-estetico',
              test: true
            })
          });
          
          const postResult = {
            url: endpoint,
            method: 'POST',
            status: postResponse.status,
            statusText: postResponse.statusText,
            ok: postResponse.ok,
            contentType: postResponse.headers.get('content-type'),
            body: null
          };
          
          try {
            postResult.body = await postResponse.text();
          } catch (e) {
            postResult.body = 'No se pudo leer el body';
          }
          
          results.push(postResult);
        }
        
      } catch (error) {
        results.push({
          url: endpoint,
          method: 'ERROR',
          error: error.message,
          status: 0,
          ok: false
        });
      }
    }
    
    console.log('✅ Diagnóstico completado');
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalEndpoints: endpoints.length,
      results: results
    });
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    res.status(500).json({
      error: 'Error ejecutando diagnóstico',
      details: error.message
    });
  }
});

// API: Test de generación (sin IA)
app.post('/api/test-generation', (req, res) => {
  console.log('🧪 Test de generación llamado');
  console.log('📝 Body:', req.body);
  res.json({ 
    success: true,
    message: 'Endpoint de generación responde correctamente',
    received: req.body
  });
});

// API: Generar blog de prueba (sin IA)
app.post('/api/generate-blog-mock', (req, res) => {
  console.log('🎭 Generando blog de prueba (mock)');
  console.log('📝 Body:', req.body);
  
  const { category, customTopic } = req.body;
  const timestamp = Date.now();
  
  const mockBlog = {
    title: customTopic || `Blog de ${category} - ${new Date().toLocaleDateString()}`,
    slug: `blog-${category}-${timestamp}`,
    excerpt: "Este es un blog de prueba generado localmente para verificar el funcionamiento del sistema.",
    content: `# ${customTopic || `Blog de ${category}`}

## Introducción

Este es un blog de prueba generado por el sistema local de BIOSKIN. El contenido ha sido creado para verificar que todo el flujo de generación, vista previa y guardado funcione correctamente.

## Desarrollo del Tema

En este apartado se desarrollaría el contenido principal del blog sobre ${category}.

### Puntos Importantes:

- **Punto 1**: Información relevante sobre el tema
- **Punto 2**: Detalles técnicos importantes  
- **Punto 3**: Beneficios y aplicaciones

## Conclusión

Este blog de prueba demuestra que el sistema está funcionando correctamente y puede generar, mostrar y guardar contenido de manera exitosa.

### Call to Action

Para más información sobre nuestros tratamientos, agenda tu consulta en BIOSKIN.`,
    category: category,
    blog_type: category,
    tags: ["medicina-estetica", "tratamientos", "bioskin", "prueba"],
    readTime: 3,
    author: 'BIOSKIN Sistema',
    published_at: new Date().toISOString().split('T')[0],
    week_year: getCurrentWeekYear(),
    is_ai_generated: false,
    ai_prompt_version: 'mock-v1.0'
  };
  
  res.json({
    success: true,
    blog: mockBlog,
    message: 'Blog de prueba generado exitosamente'
  });
});

// Función auxiliar para obtener semana del año
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
  🎯 ========================================
     BIOSKIN - Generador de Blogs con IA
  ========================================
  
  🚀 Servidor iniciado en: http://localhost:${PORT}
  📝 Interfaz disponible en: http://localhost:${PORT}/
  🖼️  Subida de imágenes: ✅ Configurada
  🤖 IA de OpenAI: ✅ Conectada
  📁 Guardado automático: ✅ Activado
  🚀 Deploy automático: ✅ Git push
  
  📋 Endpoints disponibles:
     GET  /              - Interfaz principal
     GET  /api/health    - Health check
     GET  /api/test      - Test de conexión
     POST /api/test-generation - Test de generación
     POST /api/generate-blog   - Generar blog con IA
     POST /api/upload-image    - Subir imagen
     POST /api/save-and-deploy - Guardar y desplegar
     GET  /api/blogs           - Obtener blogs
  
  🔍 LOGS ACTIVADOS - Verás todas las peticiones aquí
  ⏹️  Para detener: Ctrl+C
  `);
  
  console.log('🎬 Servidor listo. Esperando peticiones...');
});

module.exports = app;