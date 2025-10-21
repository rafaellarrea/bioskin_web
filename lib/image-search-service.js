// lib/image-search-service.js
// Servicio para obtener imágenes relevantes desde internet usando Unsplash API

// Configuración para diferentes categorías de blogs
const UNSPLASH_KEYWORDS = {
  'medico-estetico': {
    'hidratacion': ['skincare', 'hydration', 'facial treatment', 'cosmetic dermatology', 'beauty treatment'],
    'antienvejecimiento': ['anti aging', 'facial rejuvenation', 'wrinkle treatment', 'aesthetic medicine', 'beauty clinic'],
    'exosomas': ['regenerative medicine', 'cellular therapy', 'medical aesthetics', 'skin regeneration', 'aesthetic treatment'],
    'manchas': ['pigmentation', 'skin spots', 'dermatology', 'aesthetic dermatology', 'skin treatment'],
    'limpieza': ['facial cleansing', 'deep cleaning', 'skincare routine', 'facial treatment', 'beauty routine'],
    'rellenos': ['dermal fillers', 'facial volumization', 'aesthetic medicine', 'facial enhancement', 'cosmetic procedure'],
    'toxina': ['botox', 'wrinkle reduction', 'facial rejuvenation', 'aesthetic medicine', 'cosmetic treatment'],
    'laser': ['laser treatment', 'aesthetic laser', 'skin resurfacing', 'medical laser', 'cosmetic laser'],
    'radiofrecuencia': ['radiofrequency', 'skin tightening', 'non invasive', 'aesthetic technology', 'beauty treatment'],
    'plasma': ['plasma treatment', 'skin regeneration', 'aesthetic procedure', 'medical beauty', 'skin therapy'],
    'default': ['medical aesthetics', 'beauty clinic', 'skincare', 'aesthetic medicine', 'dermatology']
  },
  'tecnico': {
    'equipos': ['medical equipment', 'aesthetic technology', 'beauty devices', 'medical devices', 'clinic equipment'],
    'ipl': ['IPL technology', 'intense pulsed light', 'laser equipment', 'medical laser', 'aesthetic device'],
    'laser': ['laser technology', 'medical laser', 'aesthetic laser', 'laser equipment', 'phototherapy'],
    'radiofrecuencia': ['radiofrequency technology', 'RF device', 'aesthetic equipment', 'medical technology', 'beauty device'],
    'hifu': ['HIFU technology', 'ultrasound therapy', 'non invasive technology', 'aesthetic equipment', 'medical device'],
    'diagnostico': ['medical diagnosis', 'diagnostic equipment', 'skin analysis', 'medical technology', 'dermatology equipment'],
    'calibracion': ['equipment calibration', 'medical precision', 'technical maintenance', 'quality control', 'medical standards'],
    'protocolos': ['medical protocols', 'clinical procedures', 'treatment guidelines', 'medical standards', 'healthcare protocol'],
    'default': ['medical technology', 'aesthetic equipment', 'medical devices', 'clinical technology', 'healthcare innovation']
  }
};

// Función para generar keywords basadas en el contenido del blog
function generateKeywordsFromContent(title, category, content = '') {
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();
  
  // Buscar palabras clave específicas en el título y contenido
  const categoryKeywords = UNSPLASH_KEYWORDS[category] || UNSPLASH_KEYWORDS['medico-estetico'];
  
  // Palabras clave técnicas más específicas
  const specificKeywords = {
    // Diagnóstico e imagen
    'diagnostico': ['diagnostic equipment', 'medical diagnosis', 'skin analysis'],
    'imagen': ['diagnostic equipment', 'medical imaging', 'skin analysis'],
    'capturas': ['diagnostic equipment', 'medical imaging', 'photography'],
    'fotografia': ['medical photography', 'diagnostic equipment', 'skin analysis'],
    'analisis': ['diagnostic equipment', 'skin analysis', 'medical diagnosis'],
    
    // Tecnologías específicas
    'ipl': ['IPL technology', 'intense pulsed light', 'laser treatment'],
    'laser': ['laser technology', 'laser treatment', 'medical laser'],
    'hifu': ['HIFU technology', 'ultrasound therapy', 'non invasive'],
    'radiofrecuencia': ['radiofrequency', 'RF treatment', 'skin tightening'],
    'plasma': ['plasma treatment', 'skin regeneration', 'medical aesthetics'],
    
    // Tratamientos estéticos
    'hidratacion': ['hydration', 'skincare', 'facial treatment'],
    'acido hialuronico': ['skincare', 'hydration', 'dermal fillers'],
    'botox': ['botox', 'anti aging', 'facial rejuvenation'],
    'rellenos': ['dermal fillers', 'facial enhancement', 'aesthetic medicine'],
    'exosomas': ['regenerative medicine', 'cellular therapy', 'skin regeneration'],
    'manchas': ['pigmentation', 'skin spots', 'dermatology'],
    'limpieza': ['facial cleansing', 'skincare', 'beauty treatment'],
    
    // Equipos médicos
    'equipos': ['medical equipment', 'medical devices', 'aesthetic equipment'],
    'calibracion': ['medical equipment', 'precision', 'quality control'],
    'protocolos': ['medical protocols', 'clinical procedures', 'medical standards'],
    'innovacion': ['medical technology', 'innovation', 'aesthetic equipment']
  };
  
  // Buscar coincidencias específicas primero
  for (const [keyword, keywords] of Object.entries(specificKeywords)) {
    if (titleLower.includes(keyword) || contentLower.includes(keyword)) {
      console.log(`Found specific keyword "${keyword}" -> using:`, keywords);
      return keywords;
    }
  }
  
  // Encontrar la mejor coincidencia de keywords de categoría
  for (const [key, keywords] of Object.entries(categoryKeywords)) {
    if (titleLower.includes(key) || contentLower.includes(key)) {
      console.log(`Found category keyword "${key}" -> using:`, keywords);
      return keywords;
    }
  }
  
  console.log(`Using default keywords for category "${category}"`);
  return categoryKeywords.default;
}

// Función para construir URL de Unsplash con imágenes específicas por tema
function buildUnsplashUrl(keywords, orientation = 'landscape') {
  const query = keywords.join(',');
  
  // Mapeo de keywords a imágenes específicas y relevantes
  const keywordImageMapping = {
    // Medicina Estética
    'skincare': '1559757148-5c350e0a9c6e', // Skincare routine
    'hydration': '1576091160399-112ba8d25d1f', // Facial treatment
    'facial treatment': '1559757175-070c741b80eb', // Beauty clinic
    'anti aging': '1582750433449-648ed127bb54', // Anti-aging treatment
    'dermal fillers': '1512496015851-a90fb38ba796', // Medical procedure
    'botox': '1571019613454-1cb2f99b2d8b', // Aesthetic treatment
    'laser treatment': '1585652906653-f7d564bc68c2', // Medical technology
    'radiofrequency': '1588776814546-1ffcf47267a5', // RF treatment
    'plasma treatment': '1573987791518-24d40e9e7d17', // Dermatology
    
    // Tecnología Médica
    'medical equipment': '1556909114-f6e7ad7d3136', // Medical equipment
    'laser technology': '1581056491530-efa6b7b50ee9', // Laser equipment
    'IPL technology': '1576768122222-6b7d4b3fcdab', // Light technology
    'HIFU technology': '1559059922-5eb5b5c8e9a5', // Ultrasound tech
    'diagnostic equipment': '1576166073083-4cb9e1e3c7b4', // Diagnostic tools
    'medical devices': '1559225457-5e1f1b97c96d', // Medical devices
    
    // Categorías por defecto
    'medical aesthetics': '1559757148-5c350e0a9c6e', // Default aesthetic
    'beauty clinic': '1559757175-070c741b80eb', // Default clinic
    'aesthetic medicine': '1576091160399-112ba8d25d1f', // Default medical
    'default': '1559757148-5c350e0a9c6e' // Fallback
  };
  
  // Buscar imagen específica para la primera keyword
  let selectedImageId = keywordImageMapping['default'];
  
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    if (keywordImageMapping[keywordLower]) {
      selectedImageId = keywordImageMapping[keywordLower];
      break;
    }
  }
  
  return `https://images.unsplash.com/photo-${selectedImageId}?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=600&q=80`;
}

// ✅ NUEVA FUNCIÓN: Búsqueda en tiempo real usando query específico
function buildRealTimeUnsplashUrl(searchQuery) {
  // Limpiar y optimizar el query para búsqueda
  const cleanQuery = searchQuery
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Agregar términos médicos/estéticos para contexto
  const medicalContext = cleanQuery.includes('medical') || cleanQuery.includes('aesthetic') 
    ? cleanQuery 
    : `${cleanQuery} medical aesthetic treatment`;
  
  // Codificar para URL
  const encodedQuery = encodeURIComponent(medicalContext);
  
  // Usar Unsplash Source API para búsqueda directa
  // Formato: https://source.unsplash.com/1200x600/?query
  const imageUrl = `https://source.unsplash.com/1200x600/?${encodedQuery}`;
  
  console.log(`🔍 Búsqueda en tiempo real: "${medicalContext}" → ${imageUrl}`);
  
  return imageUrl;
}

// Función principal para generar URL de imagen
export function generateBlogImage(blog) {
  const { title, category, content, excerpt, visualDescription } = blog;
  
  try {
    let keywords;
    
    // ✅ PRIORIDAD 1: Si hay descripción visual generada por IA, usarla para búsqueda en tiempo real
    if (visualDescription && visualDescription.trim()) {
      keywords = visualDescription.split(' ').filter(word => word.length > 2);
      console.log(`🎯 Usando descripción visual de IA: "${visualDescription}"`);
      
      // ✅ BÚSQUEDA EN TIEMPO REAL: Usar keywords directos para consulta a Unsplash
      const searchQuery = keywords.join(' ');
      const imageUrl = buildRealTimeUnsplashUrl(searchQuery);
      
      return {
        url: imageUrl,
        keywords: keywords,
        attribution: 'Photo by Unsplash contributors',
        source: 'ai-description-realtime',
        searchQuery: searchQuery
      };
    } else {
      // ✅ PRIORIDAD 2: Generar keywords basadas en el contenido
      keywords = generateKeywordsFromContent(title, category, content || excerpt);
      console.log(`📝 Usando keywords del contenido: ${keywords.join(', ')}`);
      
      // Usar el sistema de mapeo existente como fallback
      const imageUrl = buildUnsplashUrl(keywords);
      
      return {
        url: imageUrl,
        keywords: keywords,
        attribution: 'Photo by Unsplash contributors',
        source: 'content-analysis-mapped'
      };
    }
    
  } catch (error) {
    console.error('Error generating blog image:', error);
    
    // Fallback a imagen por defecto por categoría
    const defaultImages = {
      'medico-estetico': '/images/blog/medico-estetico/default.jpg',
      'tecnico': '/images/blog/tecnico/default.jpg'
    };
    
    return {
      url: defaultImages[category] || '/images/logo/logo1.jpg',
      keywords: ['default'],
      attribution: 'BIOSKIN default image'
    };
  }
}

// Función para generar múltiples opciones de imagen
export function generateMultipleBlogImages(blog, count = 3) {
  const images = [];
  const { title, category, content, excerpt } = blog;
  
  try {
    const keywords = generateKeywordsFromContent(title, category, content || excerpt);
    
    for (let i = 0; i < count; i++) {
      const imageUrl = buildUnsplashUrl(keywords);
      images.push({
        url: imageUrl,
        keywords: keywords,
        attribution: 'Photo by Unsplash contributors'
      });
    }
    
    return images;
    
  } catch (error) {
    console.error('Error generating multiple blog images:', error);
    return [generateBlogImage(blog)];
  }
}

// Función para obtener imagen optimizada por categoría
export function getCategoryOptimizedImage(category, topic = '') {
  const categoryKeywords = UNSPLASH_KEYWORDS[category] || UNSPLASH_KEYWORDS['medico-estetico'];
  
  let selectedKeywords = categoryKeywords.default;
  
  if (topic) {
    const topicLower = topic.toLowerCase();
    for (const [key, keywords] of Object.entries(categoryKeywords)) {
      if (topicLower.includes(key)) {
        selectedKeywords = keywords;
        break;
      }
    }
  }
  
  return buildUnsplashUrl(selectedKeywords);
}