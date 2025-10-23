// server.js - Servidor local para el generador de blogs BIOSKIN
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = 3333;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo JPG, PNG, WEBP.'));
    }
  }
});

// Importar servicios
const BlogGenerator = require('./services/blog-generator');
const BlogManager = require('./services/blog-manager');
const DeployManager = require('./services/deploy-manager');

// Instanciar servicios
const blogGenerator = new BlogGenerator();
const blogManager = new BlogManager();
const deployManager = new DeployManager();

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

// Generar blog con IA
app.post('/api/generate-blog', async (req, res) => {
  try {
    const { blogType, topic, manual } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'El tema del blog es requerido'
      });
    }
    
    const result = await blogGenerator.generateBlog({
      blogType: blogType || 'medico-estetico',
      topic,
      manual: manual || false
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error generando blog:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando el blog',
      error: error.message
    });
  }
});

// Subir imagen
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se recibió ningún archivo'
      });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      imageUrl: imageUrl,
      filename: req.file.filename,
      originalname: req.file.originalname
    });
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error subiendo la imagen',
      error: error.message
    });
  }
});

// Servir archivos subidos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Guardar blog
app.post('/api/save-blog', async (req, res) => {
  try {
    const { blogData } = req.body;
    
    if (!blogData) {
      return res.status(400).json({
        success: false,
        message: 'Los datos del blog son requeridos'
      });
    }
    
    const result = await blogManager.saveBlog(blogData);
    res.json(result);
  } catch (error) {
    console.error('Error guardando blog:', error);
    res.status(500).json({
      success: false,
      message: 'Error guardando el blog',
      error: error.message
    });
  }
});

// Desplegar blog
app.post('/api/deploy-blog', async (req, res) => {
  try {
    const { blogSlug, commitMessage } = req.body;
    
    const result = await deployManager.deployBlog({
      blogSlug,
      commitMessage: commitMessage || 'Nuevo blog generado localmente'
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error desplegando blog:', error);
    res.status(500).json({
      success: false,
      message: 'Error desplegando el blog',
      error: error.message
    });
  }
});

// Obtener lista de blogs guardados
app.get('/api/saved-blogs', async (req, res) => {
  try {
    const blogs = await blogManager.getSavedBlogs();
    res.json({
      success: true,
      blogs: blogs
    });
  } catch (error) {
    console.error('Error obteniendo blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo la lista de blogs',
      error: error.message
    });
  }
});

// Obtener blog específico
app.get('/api/blog/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await blogManager.getBlogBySlug(slug);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog no encontrado'
      });
    }
    
    res.json({
      success: true,
      blog: blog
    });
  } catch (error) {
    console.error('Error obteniendo blog:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo el blog',
      error: error.message
    });
  }
});

// Manejar errores
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
});

module.exports = app;