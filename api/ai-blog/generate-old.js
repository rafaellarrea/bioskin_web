// api/ai-blog/generate.js

import { 
  generateBlogWithAI, 
  validateAIConfiguration, 
  checkWeeklyLimits,
  getWeeklyStatus,
  BLOG_TOPICS
} from '../../lib/ai-service.js';
import { blogQueries, initializeDatabase } from '../../lib/database.js';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    // Validar configuración de IA
    validateAIConfiguration();

    // Inicializar base de datos
    const dbPath = path.join(__dirname, '..', '..', 'data', 'blogs.db');
    const db = new Database(dbPath);
    initializeDatabase();

    const { 
      blogType = 'medico-estetico', 
      topic, 
      manual = false,
      forceGeneration = false // Para testing o casos especiales
    } = req.body;

    // Validar tipo de blog
    if (!['medico-estetico', 'tecnico'].includes(blogType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tipo de blog inválido. Usar: medico-estetico o tecnico' 
      });
    }

    // Verificar límites semanales (excepto si es forzado)
    if (!forceGeneration) {
      const canGenerate = await checkWeeklyLimits(blogType, db);
      if (!canGenerate) {
        const weeklyStatus = await getWeeklyStatus(db);
        return res.status(429).json({
          success: false,
          message: `Límite semanal alcanzado para blogs ${blogType}`,
          weeklyStatus: weeklyStatus
        });
      }
    }

    // Seleccionar topic (manual o automático)
    let selectedTopic;
    if (manual && topic) {
      selectedTopic = topic;
    } else {
      const topics = BLOG_TOPICS[blogType];
      selectedTopic = topics[Math.floor(Math.random() * topics.length)];
    }

    console.log(`🤖 Generando blog: "${selectedTopic}" (${blogType})`);

    // Generar contenido con IA usando nueva estructura
    const aiResult = await generateBlogWithAI(selectedTopic, blogType, manual);

    if (!aiResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Error generando contenido con IA',
        error: aiResult.error
      });
    }

    const blogData = aiResult.blog;

    // Preparar datos del blog
    const blogData = {
      title: aiResult.title,
      slug: finalSlug,
      excerpt: aiResult.excerpt,
      content: aiResult.content,
      category: category,
      author: category === 'medico-estetico' ? 'Dra. Daniela Creamer' : 'Equipo Técnico BIOSKIN',
      publishedAt: new Date().toISOString().split('T')[0],
      readTime: aiResult.readTime,
      image: `/images/blog/${finalSlug}.jpg`,
      featured: Math.random() > 0.7 // 30% posibilidad de ser destacado
    };

    // Guardar en base de datos
    try {
      const blogId = createCompleteBlog(blogData, aiResult.tags, aiResult.citations);
      
      console.log(`Blog guardado exitosamente con ID: ${blogId}`);

      res.status(200).json({
        success: true,
        message: 'Blog generado y guardado exitosamente',
        blog: {
          id: blogId,
          ...blogData,
          tags: aiResult.tags,
          citations: aiResult.citations
        },
        searchInfo: searchInfo
      });

    } catch (dbError) {
      console.error('Error guardando en base de datos:', dbError);
      res.status(500).json({
        success: false,
        message: 'Error guardando el blog en base de datos',
        error: dbError.message
      });
    }

  } catch (error) {
    console.error('Error generando blog:', error);
    
    if (error.message.includes('OPENAI_API_KEY')) {
      res.status(500).json({
        success: false,
        message: 'Configuración de IA no válida. Verificar OPENAI_API_KEY',
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
}

// Función para ejecutar generación automática (para Vercel Cron)
export async function generateAutomaticBlog() {
  const categories = ['medico-estetico', 'tecnico'];
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  try {
    const response = await fetch('/api/ai-blog/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category })
    });
    
    const result = await response.json();
    console.log('Blog automático generado:', result.blog?.title);
    return result;
  } catch (error) {
    console.error('Error en generación automática:', error);
  }
}