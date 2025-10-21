// api/blogs/list-all.js
// Endpoint para listar TODOS los blogs disponibles (estáticos, dinámicos, y migrados)

import { getDynamicBlogs } from '../../lib/dynamic-blogs-storage.js';

// Blogs estáticos predefinidos
const staticBlogs = [
  {
    id: 'beneficios-ipl',
    title: 'Los Beneficios de la Tecnología IPL en Tratamientos Estéticos',
    slug: 'beneficios-tecnologia-ipl-tratamientos-esteticos',
    excerpt: 'Descubre cómo la tecnología IPL revoluciona los tratamientos de rejuvenecimiento facial y corporal con resultados excepcionales.',
    content: '# Los Beneficios de la Tecnología IPL\n\nLa tecnología de Luz Pulsada Intensa (IPL) representa uno de los avances más significativos en medicina estética...',
    category: 'medico-estetico',
    author: 'Dr. BIOSKIN',
    publishedAt: '2024-01-15T10:00:00.000Z',
    readTime: 6,
    tags: ['IPL', 'rejuvenecimiento', 'tecnología'],
    image: '/images/productos/dispositivos/ipl/equipo-principal.jpg',
    featured: true,
    source: 'static'
  },
  {
    id: 'cuidado-piel-invierno',
    title: 'Cuidado de la Piel en Invierno: Guía Completa',
    slug: 'cuidado-piel-invierno-guia-completa',
    excerpt: 'Aprende cómo proteger y cuidar tu piel durante los meses más fríos del año con consejos profesionales.',
    content: '# Cuidado de la Piel en Invierno\n\nDurante los meses de invierno, nuestra piel enfrenta desafíos únicos...',
    category: 'cuidado-piel',
    author: 'BIOSKIN Team',
    publishedAt: '2024-02-01T14:30:00.000Z',
    readTime: 8,
    tags: ['cuidado de piel', 'invierno', 'hidratación'],
    image: '/images/services/hidratacionProfunda/resultado1.jpg',
    featured: false,
    source: 'static'
  }
];

export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Solo se permite método GET'
    });
  }

  try {
    // Obtener blogs dinámicos del sistema
    const dynamicBlogs = getDynamicBlogs() || [];
    
    // Combinar todos los blogs
    const allBlogs = [
      ...dynamicBlogs,  // Blogs dinámicos (incluye migrados y predeterminados)
      ...staticBlogs    // Blogs estáticos
    ];

    // Eliminar duplicados por slug
    const uniqueBlogs = allBlogs.filter((blog, index, array) => 
      array.findIndex(b => b.slug === blog.slug) === index
    );

    // Ordenar por fecha de publicación (más recientes primero)
    uniqueBlogs.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // Estadísticas
    const stats = {
      total: uniqueBlogs.length,
      dynamic: dynamicBlogs.length,
      static: staticBlogs.length,
      byCategory: {},
      bySource: {}
    };

    // Calcular estadísticas por categoría y fuente
    uniqueBlogs.forEach(blog => {
      // Por categoría
      if (!stats.byCategory[blog.category]) {
        stats.byCategory[blog.category] = 0;
      }
      stats.byCategory[blog.category]++;

      // Por fuente
      if (!stats.bySource[blog.source]) {
        stats.bySource[blog.source] = 0;
      }
      stats.bySource[blog.source]++;
    });

    console.log(`📊 Blogs listados: ${uniqueBlogs.length} total (${dynamicBlogs.length} dinámicos, ${staticBlogs.length} estáticos)`);

    return res.status(200).json({
      success: true,
      blogs: uniqueBlogs,
      stats: stats,
      message: `${uniqueBlogs.length} blogs disponibles`,
      endpoint: '/api/blogs/list-all'
    });

  } catch (error) {
    console.error('❌ Error listando todos los blogs:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
      endpoint: '/api/blogs/list-all'
    });
  }
}