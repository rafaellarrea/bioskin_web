// api/ai-blog/generate.js

import { generateBlogWithAI, selectRandomTopic, validateAIConfiguration, searchMedicalInfo } from '../../lib/ai-service.js';
import { createCompleteBlog } from '../../lib/database.js';
import { slugify } from '../../lib/utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    // Validar configuración de IA
    validateAIConfiguration();

    const { category = 'medico-estetico', topic, manual = false } = req.body;

    // Validar categoría
    if (!['medico-estetico', 'tecnico'].includes(category)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Categoría inválida. Usar: medico-estetico o tecnico' 
      });
    }

    // Seleccionar topic (manual o automático)
    let selectedTopic;
    if (manual && topic) {
      selectedTopic = topic;
    } else {
      selectedTopic = selectRandomTopic(category);
    }

    console.log(`Generando blog sobre: "${selectedTopic}" (${category})`);

    // Buscar información médica actualizada
    const searchInfo = await searchMedicalInfo(selectedTopic, category);

    // Generar contenido con IA
    const aiResult = await generateBlogWithAI(selectedTopic, category);

    // Crear slug único
    const baseSlug = slugify(selectedTopic);
    let finalSlug = baseSlug;
    let counter = 1;

    // Verificar que el slug sea único (en producción, hacer query a BD)
    // Por ahora usamos timestamp para garantizar unicidad
    finalSlug = `${baseSlug}-${Date.now()}`;

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