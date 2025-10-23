// server-simple.js - Versión simplificada para pruebas
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const app = express();
const PORT = 3333;

console.log(`
  ╔════════════════════════════════════════╗
  ║        BIOSKIN BLOG GENERATOR          ║
  ║              LOCAL SERVER              ║
  ╠════════════════════════════════════════╣
  ║  🌐 Servidor: http://localhost:${PORT}     ║
  ║  📝 Generación de blogs con IA         ║
  ║  🖼️  Gestión de imágenes               ║
  ║  🚀 Despliegue automático              ║
  ╚════════════════════════════════════════╝
  
  Presiona Ctrl+C para detener el servidor
  `);

// Middlewares básicos
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Verificar directorios
const projectRoot = path.join(__dirname, '../');
const blogsDir = path.join(projectRoot, 'src/data/blogs');

fs.ensureDir(blogsDir).then(() => {
  console.log('📁 Directorios de blogs verificados');
}).catch(err => {
  console.error('❌ Error creando directorios:', err.message);
});

// RUTAS BÁSICAS

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

// Generar blog con IA (versión simplificada)
app.post('/api/generate-blog', async (req, res) => {
  try {
    const { blogType, topic } = req.body;
    
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
        message: 'OPENAI_API_KEY no configurada. Por favor, configura tu API key en el archivo .env'
      });
    }

    // Para esta versión simplificada, importamos OpenAI aquí
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log(`🤖 Generando blog: ${topic} (Tipo: ${blogType})`);

    // Prompt básico
    const systemPrompt = blogType === 'tecnico' 
      ? 'Eres un ingeniero biomédico especialista en equipos de medicina estética. Escribe contenido técnico profesional en español.'
      : 'Eres un experto en medicina estética. Escribe blogs profesionales para BIOSKIN en español, con información médica precisa.';

    const userPrompt = `Escribe un blog profesional sobre: "${topic}"

ESTRUCTURA REQUERIDA:
# [Título atractivo]

[Introducción]

## ¿Qué es [el tratamiento]?
[Explicación técnica]

## Beneficios y Ventajas
[Lista de beneficios]

## Protocolo de Tratamiento BIOSKIN
[Proceso paso a paso]

## Resultados Esperados
[Timeline de resultados]

## Conclusión
[Resumen y llamada a la acción]

IMPORTANTE: Usa 800-1200 palabras, menciona BIOSKIN naturalmente, y mantén un tono profesional pero accesible.`;

    // Generar con OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 3000,
      temperature: 0.7
    });

    const content = completion.choices[0].message.content;

    // Extraer título
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : 'Blog Sin Título';

    // Generar slug
    const slug = title
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

    // Generar excerpt
    const plainText = content
      .replace(/^#.*$/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .trim();
    const excerpt = plainText.substring(0, 150) + '...';

    // Tags básicos
    const tags = blogType === 'tecnico' 
      ? ['tecnología', 'equipos médicos', 'BIOSKIN', 'parámetros técnicos']
      : ['medicina estética', 'tratamientos', 'BIOSKIN', 'rejuvenecimiento'];

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
      readTime: Math.ceil(content.length / 1000),
      tags: tags,
      image: '',
      imagenPrincipal: '',
      imagenConclusion: '',
      featured: false,
      source: 'ai-generated-local'
    };

    console.log(`✅ Blog generado exitosamente: ${title}`);

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
    res.status(500).json({
      success: false,
      message: 'Error generando el blog',
      error: error.message
    });
  }
});

// Guardar blog
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

    // Guardar archivo
    await fs.writeFile(filePath, JSON.stringify(blogData, null, 2), 'utf8');

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

// Desplegar blog (versión simplificada)
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

    // Para el despliegue usamos simple-git
    const simpleGit = require('simple-git');
    const git = simpleGit(projectRoot);

    // Añadir archivo
    const relativePath = path.relative(projectRoot, blogPath);
    await git.add(relativePath);

    // Commit
    const message = commitMessage || `📝 Nuevo blog generado: ${blogSlug}`;
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

// Ruta para subir imágenes (simplificada)
app.post('/api/upload-image', (req, res) => {
  // Por ahora solo devolvemos una respuesta mock
  res.json({
    success: false,
    message: 'Función de subida de imágenes en desarrollo'
  });
});

// Lista de blogs guardados
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
});

module.exports = app;