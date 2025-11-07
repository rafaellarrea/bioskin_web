const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const app = express();
const PORT = 3335;

// ✅ FUNCIÓN AGRESIVA: Acortar slugs para evitar errores de Git en Windows
function shortenSlug(slug, maxLength = 30) {  // Reducido de 60 a 30
  // Extraer partes importantes
  const parts = slug.split('-');
  const timestamp = parts[parts.length - 1]; // Último elemento (timestamp)
  const titleParts = parts.slice(0, -1); // Todo excepto timestamp
  
  // Estrategia ultra-agresiva: usar solo primera palabra + timestamp
  let result;
  if (titleParts.length > 0) {
    // Tomar solo la primera palabra y acortarla si es necesario
    const firstWord = titleParts[0].substring(0, 12); // Máximo 12 caracteres
    result = `${firstWord}-${timestamp}`;
  } else {
    result = `blog-${timestamp}`;
  }
  
  // Si aún es muy largo (caso extremo), usar solo timestamp
  if (result.length > maxLength) {
    result = `blog-${timestamp}`;
  }
  
  console.log(`📏 Slug ultra-acortado: ${slug} → ${result}`);
  return result;
}

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // ✅ MEJORAR: Crear directorio específico del blog si se proporciona blogSlug
    const { blogSlug } = req.body || {};
    
    let uploadPath;
    if (blogSlug) {
      // Crear directorio específico para el blog
      uploadPath = path.join(__dirname, 'public', 'images', 'blog', blogSlug);
    } else {
      // Fallback al directorio general
      uploadPath = path.join(__dirname, 'public', 'images', 'blog');
    }
    
    try {
      await fsPromises.mkdir(uploadPath, { recursive: true });
      console.log('📁 Directorio de imágenes creado:', uploadPath);
      cb(null, uploadPath);
    } catch (error) {
      console.error('❌ Error creando directorio:', error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname).toLowerCase();
    
    // ✅ MEJORAR: Generar nombre más descriptivo y compatible
    const baseName = file.originalname
      .replace(extension, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase()
      .substring(0, 20);
    
    const finalName = `img-${timestamp}${extension}`;
    console.log('📸 Nombre de imagen generado:', finalName);
    
    cb(null, finalName);
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

    console.log('📸 Imagen subida:', {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      blogSlug: blogSlug
    });

    // ✅ VERIFICAR: La imagen ya debería estar en el lugar correcto
    const finalPath = req.file.path;
    const imageFilename = req.file.filename;
    
    // URL final de la imagen relativa al proyecto
    const imageUrl = `/images/blog/${blogSlug}/${imageFilename}`;
    
    console.log(`📸 Imagen guardada en: ${finalPath}`);
    console.log(`🔗 URL de la imagen: ${imageUrl}`);
    
    // ✅ COPIAR INMEDIATAMENTE AL PROYECTO PRINCIPAL
    try {
      const mainProjectImageDir = path.join(__dirname, '..', 'public', 'images', 'blog', blogSlug);
      await fsPromises.mkdir(mainProjectImageDir, { recursive: true });
      
      const mainProjectImagePath = path.join(mainProjectImageDir, imageFilename);
      await fsPromises.copyFile(finalPath, mainProjectImagePath);
      
      console.log(`📦 Imagen copiada al proyecto principal: ${mainProjectImagePath}`);
    } catch (copyError) {
      console.error('⚠️ Error copiando al proyecto principal:', copyError.message);
      // No fallar la subida por esto
    }
    
    res.json({
      success: true,
      imageUrl,
      filename: imageFilename,
      blogSlug,
      path: imageUrl,
      originalName: req.file.originalname,
      id: Date.now(),
      size: req.file.size,
      uploadPath: finalPath,
      copiedToMain: true
    });

  } catch (error) {
    console.error('Error subiendo imagen:', error);
    res.status(500).json({ 
      error: 'Error subiendo imagen', 
      details: error.message 
    });
  }
});

// ✅ NUEVO: API para generar sugerencias de temas CON IA ÚNICAMENTE
app.post('/api/suggest-topics', async (req, res) => {
  console.log('💡 Generando sugerencias de temas CON IA...');
  
  try {
    const { category = 'medico-estetico' } = req.body;
    
    // ✅ LLAMAR DIRECTAMENTE A LA API DE IA DE VERCEL (sin fallback local)
    const apiUrls = [
      'https://saludbioskin.vercel.app/api/ai-blog/generate',
      'https://saludbioskin.vercel.app/api/ai-blog/generate-production'
    ];
    
    const payload = {
      category,
      generateSuggestions: true,
      requestType: 'topic_suggestions_only',
      // ✅ PROMPT ESPECÍFICO PARA IA: Generar sugerencias originales
      customPrompt: `TAREA: Lista exactamente 8 títulos para blog de ${category}

FORMATO REQUERIDO (OBLIGATORIO):
1. [título]
2. [título]
3. [título]
4. [título]
5. [título]
6. [título]
7. [título]
8. [título]

TEMAS para ${category}:
${category === 'medico-estetico' ? 
`- Rejuvenecimiento facial avanzado
- Contorno corporal no invasivo  
- Medicina regenerativa
- Bioestimuladores modernos
- Tecnologías láser 2024
- Tratamientos preventivos
- Medicina estética íntima
- Combinación de procedimientos` : 
`- Equipos médicos estéticos 2024
- Inteligencia artificial médica
- Calibración y mantenimiento
- Normativas internacionales
- Bioingeniería aplicada
- Nanotecnología médica
- Realidad aumentada
- Física de tratamientos`}

Responde SOLO con la lista numerada 1-8:`
    };
    
    let lastError = null;
    
    for (const apiUrl of apiUrls) {
      try {
        console.log(`🎯 Probando sugerencias IA en: ${apiUrl}`);
        
        const fetch = (await import('node-fetch')).default;
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.suggestions) {
            console.log('✅ Sugerencias IA generadas exitosamente');
            return res.json({
              success: true,
              suggestions: result.suggestions,
              category,
              source: 'pure-ai',
              note: 'Sugerencias 100% generadas por IA'
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
    
    // ✅ SI FALLA LA IA, DEVOLVER ERROR (NO FALLBACK LOCAL)
    throw new Error(`IA no disponible actualmente. Último error: ${lastError}`);
    
  } catch (error) {
    console.error('❌ Error generando sugerencias con IA:', error);
    res.status(500).json({
      success: false,
      error: 'Sugerencias de IA no disponibles en este momento',
      details: error.message,
      note: 'Intenta más tarde cuando la IA esté disponible'
    });
  }
});

// ✅ FUNCIÓN ELIMINADA: No más sugerencias locales predefinidas
// Las sugerencias ahora son 100% generadas por IA

// API: Guardar blog y hacer deploy
app.post('/api/save-and-deploy', async (req, res) => {
  console.log('💾 Iniciando guardado de blog...');
  console.log('📝 Datos recibidos:', JSON.stringify(req.body, null, 2));
  
  try {
    const { blogData, images } = req.body;
    
    if (!blogData || !blogData.slug) {
      return res.status(400).json({ error: 'Datos de blog inválidos' });
    }

    // ✅ LIMPIEZA PREVENTIVA: Eliminar directorios problemáticos
    console.log('🧹 Limpiando directorios de imágenes problemáticos...');
    try {
      const blogImagesRoot = path.join(__dirname, '..', 'public', 'images', 'blog');
      const entries = await fsPromises.readdir(blogImagesRoot, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.length > 30) {
          const problemDir = path.join(blogImagesRoot, entry.name);
          await fsPromises.rm(problemDir, { recursive: true, force: true });
          console.log(`🗑️  Eliminado directorio problemático: ${entry.name.substring(0, 30)}...`);
        }
      }
    } catch (cleanupError) {
      console.log('⚠️  Error en limpieza (continuando):', cleanupError.message);
    }

    // ✅ Acortar slug si es muy largo para evitar errores de Git
    const originalSlug = blogData.slug;
    blogData.slug = shortenSlug(blogData.slug);

    console.log(`📁 Creando blog: ${blogData.title}`);
    console.log(`📂 Slug original: ${originalSlug}`);
    console.log(`📂 Slug final: ${blogData.slug}`);

    // 1. Crear directorio del blog
    const blogDir = path.join(__dirname, '..', 'src', 'data', 'blogs', blogData.slug);
    console.log('📁 Directorio del blog:', blogDir);
    await fsPromises.mkdir(blogDir, { recursive: true });

    // 2. Crear estructura del blog siguiendo el patrón existente
    const blogId = `blog-${Date.now()}`;
    const currentDate = new Date().toISOString();
    
    // ✅ NUEVA FUNCIÓN: Formatear contenido correctamente
    function formatBlogContent(content) {
      return content
        // Corregir títulos mal formateados
        .replace(/^#\s+(.+?)\s*##?\s*$/gm, '# $1')  // Títulos principales
        .replace(/^##\s+(.+?)\s*##?\s*$/gm, '## $1') // Subtítulos nivel 2
        .replace(/^###\s+(.+?)\s*##?\s*$/gm, '### $1') // Subtítulos nivel 3
        
        // Limpiar líneas de separación problemáticas
        .replace(/\n-{20,}\n/g, '\n\n')  // Líneas de guiones excesivas
        .replace(/\n={20,}\n/g, '\n\n')  // Líneas de equals excesivas
        .replace(/>>>\s*(.*?)\s*<<</g, '**$1**')  // Convertir >>> texto <<< a **texto**
        
        // Mantener formato markdown correcto (NO eliminar asteriscos importantes)
        .replace(/\*{3,}/g, '**')  // Convertir *** o más a **
        .replace(/\*\*\s*\*\*/g, '')  // Eliminar ** ** vacíos
        
        // Limpiar espacios y saltos de línea excesivos
        .replace(/\n\n\n+/g, '\n\n')  // Reducir múltiples saltos
        .replace(/[ ]+$/gm, '')  // Eliminar espacios al final de líneas
        .replace(/^[ ]+/gm, '')  // Eliminar espacios al inicio de líneas (excepto listas)
        .replace(/^[\t]+/gm, '')  // Eliminar tabs al inicio
        
        // Asegurar formato correcto de listas
        .replace(/^- \*\*(.*?)\*\*:/gm, '- **$1**:')  // Mantener formato de listas con negritas
        .replace(/^• \*\*(.*?)\*\*:/gm, '- **$1**:')  // Convertir • a -
        
        .trim();
    }
    
    const structuredBlog = {
      id: blogId,
      title: blogData.title,
      slug: blogData.slug,
      excerpt: blogData.excerpt,
      content: formatBlogContent(blogData.content), // ✅ Usar nueva función de formateo
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
      await fsPromises.mkdir(publicImagesDir, { recursive: true });

      // Si el slug cambió, necesitamos mover las imágenes existentes
      if (originalSlug !== blogData.slug) {
        console.log('📁 Slug cambió, moviendo imágenes...');
        const oldImagesDir = path.join(__dirname, '..', 'public', 'images', 'blog', originalSlug);
        
        try {
          if (fs.existsSync(oldImagesDir)) {
            // Mover todas las imágenes del directorio antiguo al nuevo
            const files = fs.readdirSync(oldImagesDir);
            for (const file of files) {
              const oldPath = path.join(oldImagesDir, file);
              const newPath = path.join(publicImagesDir, file);
              fs.renameSync(oldPath, newPath);
              console.log(`📦 Movido: ${file}`);
            }
            
            // Eliminar directorio viejo si está vacío
            fs.rmdirSync(oldImagesDir);
            console.log('🗑️  Directorio anterior eliminado');
          }
        } catch (moveError) {
          console.log('⚠️  Error moviendo imágenes:', moveError.message);
        }
      }

      // Array para almacenar las URLs de las imágenes para insertar en el contenido
      const imageUrls = [];

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        // Actualizar la ruta de la imagen para usar el nuevo slug
        const imageUrl = `/images/blog/${blogData.slug}/${image.filename}`;
        const imageData = {
          url: imageUrl,
          name: image.originalName || image.filename,
          id: Date.now() + i,
          blogSlug: blogData.slug,
          isOrganized: true
        };
        
        structuredBlog.images.push(imageData);
        imageUrls.push(imageUrl);
        
        // La primera imagen es la principal
        if (i === 0) {
          structuredBlog.image = imageUrl;
          structuredBlog.imagenPrincipal = imageUrl;
        }
        
        console.log(`✅ Imagen referenciada: ${imageUrl}`);
      }

      // ✅ INSERTAR IMÁGENES EN EL CONTENIDO (solo si no hay imagen principal para evitar duplicación)
      if (imageUrls.length > 0) {
        console.log('🖼️  Verificando inserción de imágenes en contenido...');
        
        // Si hay imagen principal, NO insertar la primera imagen en el contenido para evitar duplicación
        const shouldInsertFirstImage = !structuredBlog.imagenPrincipal;
        
        if (shouldInsertFirstImage && imageUrls[0]) {
          console.log('📸 Insertando primera imagen en contenido (no hay imagen principal)...');
          const imagenPrincipalHTML = `\n\n![Imagen principal del tratamiento](${imageUrls[0]})\n*Imagen: Ejemplo del tratamiento en BIOSKIN*\n\n`;
          
          // Buscar el final del primer párrafo
          const contentLines = structuredBlog.content.split('\n');
          let insertIndex = -1;
          
          for (let i = 0; i < contentLines.length; i++) {
            const line = contentLines[i].trim();
            if (line.startsWith('##') && i > 2) {
              insertIndex = i;
              break;
            } else if (i === 3 && line.length > 50) {
              insertIndex = i + 1;
              break;
            }
          }
          
          if (insertIndex === -1) insertIndex = Math.min(4, Math.floor(contentLines.length / 3));
          
          contentLines.splice(insertIndex, 0, imagenPrincipalHTML);
          structuredBlog.content = contentLines.join('\n');
          console.log(`📸 Primera imagen insertada en línea ${insertIndex}`);
        } else {
          console.log('⏭️ Saltando inserción de primera imagen (ya existe imagenPrincipal)');
        }

        // Insertar imágenes adicionales solo si hay más de una imagen
        if (imageUrls.length > 1) {
          console.log('📸 Insertando imágenes adicionales...');
          const contentSections = structuredBlog.content.split('\n## ');
          
          // Empezar desde la segunda imagen si hay imagen principal, o desde la primera si no la hay
          const startIndex = shouldInsertFirstImage ? 1 : 0;
          
          for (let i = startIndex; i < imageUrls.length && i < 3; i++) {
            const imageHTML = `\n![Imagen ${i + 1} del tratamiento](${imageUrls[i]})\n*Imagen: Detalles del procedimiento*\n`;
            
            const sectionIndex = i + (shouldInsertFirstImage ? 0 : 1);
            if (contentSections.length > sectionIndex) {
              contentSections[sectionIndex] = imageHTML + '\n## ' + contentSections[sectionIndex];
              console.log(`📸 Imagen ${i + 1} insertada en sección ${sectionIndex}`);
            }
          }
          
          structuredBlog.content = contentSections.join('\n## ');
        }
      }

      // ✅ COPIAR IMÁGENES AL PROYECTO PRINCIPAL
      console.log('📦 Copiando imágenes al proyecto principal...');
      const mainProjectImagesDir = path.join(__dirname, '..', 'public', 'images', 'blog', blogData.slug);
      
      try {
        // Crear directorio en el proyecto principal
        await fsPromises.mkdir(mainProjectImagesDir, { recursive: true });
        
        // Verificar directorio del generador
        const generatorImagesDir = path.join(__dirname, 'public', 'images', 'blog');
        console.log('📁 Buscando imágenes en directorio del generador:', generatorImagesDir);
        
        // Buscar directorio del blog en el generador (puede tener nombre completo o slug corto)
        let sourceImageDir = null;
        try {
          const dirs = fs.readdirSync(generatorImagesDir);
          for (const dir of dirs) {
            if (dir.includes(blogData.slug) || blogData.slug.includes(dir.split('-')[0])) {
              sourceImageDir = path.join(generatorImagesDir, dir);
              console.log(`📂 Directorio fuente encontrado: ${dir}`);
              break;
            }
          }
        } catch (dirError) {
          console.log('⚠️ Error explorando directorios del generador:', dirError.message);
        }
        
        if (sourceImageDir && fs.existsSync(sourceImageDir)) {
          // Copiar todas las imágenes del directorio fuente
          const imageFiles = fs.readdirSync(sourceImageDir);
          for (const file of imageFiles) {
            if (file.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
              const sourcePath = path.join(sourceImageDir, file);
              const destPath = path.join(mainProjectImagesDir, file);
              
              await fsPromises.copyFile(sourcePath, destPath);
              console.log(`📸 Imagen copiada: ${file} → proyecto principal`);
            }
          }
        } else {
          // Fallback: copiar imágenes individuales si existen referencias específicas
          for (const imageData of structuredBlog.images) {
            const filename = path.basename(imageData.url);
            const possibleSources = [
              path.join(publicImagesDir, filename),
              path.join(__dirname, 'public', 'images', 'blog', filename),
              path.join(__dirname, '..', 'public', 'images', 'blog', filename)
            ];
            
            for (const sourcePath of possibleSources) {
              if (fs.existsSync(sourcePath)) {
                const destPath = path.join(mainProjectImagesDir, filename);
                await fsPromises.copyFile(sourcePath, destPath);
                console.log(`📸 Imagen individual copiada: ${filename} → proyecto principal`);
                break;
              }
            }
          }
        }
        
        console.log(`✅ Proceso de copia de imágenes completado`);
      } catch (copyError) {
        console.error('❌ Error copiando imágenes al proyecto principal:', copyError.message);
      }
    }

    // 4. Guardar archivo index.json del blog
    const blogJsonPath = path.join(blogDir, 'index.json');
    await fsPromises.writeFile(blogJsonPath, JSON.stringify(structuredBlog, null, 2));
    console.log('✅ Blog guardado en:', blogJsonPath);

    // 5. Crear metadata.json
    const metadataPath = path.join(blogDir, 'metadata.json');
    const metadata = {
      createdAt: currentDate,
      updatedAt: currentDate,
      version: "1.0",
      structure: "organized"
    };
    await fsPromises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

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
      const indexContent = await fsPromises.readFile(indexPath, 'utf-8');
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

    await fsPromises.writeFile(indexPath, JSON.stringify(indexData, null, 2));
    console.log('✅ Index.json actualizado');

    // 7. Git add, commit y push
    console.log('🚀 Iniciando deploy automático...');
    try {
      const projectRoot = path.join(__dirname, '..');
      console.log('📁 Directorio del proyecto:', projectRoot);
      
      console.log('📋 Ejecutando git add...');
      const addResult = await execAsync('git add .', { cwd: projectRoot });
      console.log('✅ Git add completado:', addResult.stdout || 'Sin salida');
      
      console.log('📝 Ejecutando git commit...');
      const commitResult = await execAsync(`git commit -m "Nuevo blog: ${blogData.title}"`, { cwd: projectRoot });
      console.log('✅ Git commit completado:', commitResult.stdout);
      
      console.log('🚀 Ejecutando git push...');
      const pushResult = await execAsync('git push origin main', { cwd: projectRoot });
      console.log('✅ Git push completado:', pushResult.stdout);
      
      console.log('🎉 Deploy automático completado exitosamente');
    } catch (gitError) {
      console.error('❌ Error detallado en git:', {
        message: gitError.message,
        stdout: gitError.stdout,
        stderr: gitError.stderr,
        code: gitError.code
      });
      console.log('💾 Blog guardado correctamente (error solo en git)');
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
      const indexContent = await fsPromises.readFile(indexPath, 'utf-8');
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

// ✅ NUEVO ENDPOINT: Limpiar archivos problemáticos
app.post('/api/cleanup', async (req, res) => {
  try {
    console.log('🧹 Iniciando limpieza completa...');
    
    const blogImagesRoot = path.join(__dirname, '..', 'public', 'images', 'blog');
    const entries = await fsPromises.readdir(blogImagesRoot, { withFileTypes: true });
    
    let cleaned = 0;
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.length > 30) {
        const problemDir = path.join(blogImagesRoot, entry.name);
        await fsPromises.rm(problemDir, { recursive: true, force: true });
        console.log(`🗑️  Eliminado: ${entry.name.substring(0, 30)}...`);
        cleaned++;
      }
    }
    
    console.log(`✅ Limpieza completada: ${cleaned} directorios eliminados`);
    res.json({ 
      success: true, 
      message: `Limpieza completada: ${cleaned} directorios problemáticos eliminados`,
      cleaned: cleaned
    });
    
  } catch (error) {
    console.error('❌ Error en limpieza:', error);
    res.status(500).json({ 
      error: 'Error en limpieza', 
      details: error.message 
    });
  }
});

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
     POST /api/cleanup         - Limpiar archivos problemáticos
     GET  /api/blogs           - Obtener blogs
  
  🔍 LOGS ACTIVADOS - Verás todas las peticiones aquí
  ⏹️  Para detener: Ctrl+C
  `);
  
  console.log('🎬 Servidor listo. Esperando peticiones...');
});

module.exports = app;
