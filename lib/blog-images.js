// lib/blog-images.js
// Base de datos de imágenes profesionales para blogs médico-estéticos

export const MEDICAL_AESTHETIC_IMAGES = {
  // Tratamientos faciales
  'hidratacion': [
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&h=600&fit=crop&crop=face'
  ],
  'antiaging': [
    'https://images.unsplash.com/photo-1559757175-0eb8673fc9d0?w=800&h=600&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&h=600&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&crop=face'
  ],
  'limpieza': [
    'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&h=600&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&h=600&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&crop=face'
  ],
  'exosomas': [
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&h=600&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&h=600&fit=crop&crop=face'
  ],
  'manchas': [
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&h=600&fit=crop&crop=face'
  ],
  'acido-hialuronico': [
    'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&h=600&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&h=600&fit=crop&crop=face'
  ],
  'mesoterapia': [
    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&h=600&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1559757175-0eb8673fc9d0?w=800&h=600&fit=crop&crop=face'
  ]
};

export const TECHNICAL_IMAGES = {
  // Equipamiento médico
  'laser': [
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&crop=entropy',
    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&h=600&fit=crop&crop=entropy',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&crop=entropy'
  ],
  'ipl': [
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop&crop=entropy',
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&crop=entropy',
    'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&h=600&fit=crop&crop=entropy'
  ],
  'radiofrecuencia': [
    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&h=600&fit=crop&crop=entropy',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&crop=entropy',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop&crop=entropy'
  ],
  'hifu': [
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&crop=entropy',
    'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&h=600&fit=crop&crop=entropy',
    'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&h=600&fit=crop&crop=entropy'
  ],
  'diagnostico': [
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop&crop=entropy',
    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&h=600&fit=crop&crop=entropy',
    'https://images.unsplash.com/photo-1559757175-0eb8673fc9d0?w=800&h=600&fit=crop&crop=entropy'
  ]
};

// Función para obtener imagen basada en el tema del blog
export function getBlogImage(category, topic) {
  const topicLower = topic.toLowerCase();
  
  // Detectar tema por palabras clave
  let imageCategory = '';
  
  if (category === 'medico-estetico') {
    if (topicLower.includes('hidrat') || topicLower.includes('sérum') || topicLower.includes('suero')) {
      imageCategory = 'hidratacion';
    } else if (topicLower.includes('antiaging') || topicLower.includes('arrugas') || topicLower.includes('rejuven')) {
      imageCategory = 'antiaging';
    } else if (topicLower.includes('limpieza') || topicLower.includes('facial profund') || topicLower.includes('purif')) {
      imageCategory = 'limpieza';
    } else if (topicLower.includes('exosoma') || topicLower.includes('regenerat') || topicLower.includes('células')) {
      imageCategory = 'exosomas';
    } else if (topicLower.includes('mancha') || topicLower.includes('pigment') || topicLower.includes('despigment')) {
      imageCategory = 'manchas';
    } else if (topicLower.includes('hialurón') || topicLower.includes('rellen') || topicLower.includes('volum')) {
      imageCategory = 'acido-hialuronico';
    } else if (topicLower.includes('mesoterap') || topicLower.includes('microinyecc') || topicLower.includes('nctf')) {
      imageCategory = 'mesoterapia';
    } else {
      imageCategory = 'hidratacion'; // Default para médico-estético
    }
    
    const images = MEDICAL_AESTHETIC_IMAGES[imageCategory] || MEDICAL_AESTHETIC_IMAGES.hidratacion;
    return images[Math.floor(Math.random() * images.length)];
    
  } else if (category === 'tecnico') {
    if (topicLower.includes('láser') || topicLower.includes('laser') || topicLower.includes('co2') || topicLower.includes('nd:yag')) {
      imageCategory = 'laser';
    } else if (topicLower.includes('ipl') || topicLower.includes('luz pulsada') || topicLower.includes('fototermó')) {
      imageCategory = 'ipl';
    } else if (topicLower.includes('radiofrecuenc') || topicLower.includes('rf ') || topicLower.includes('monopolar')) {
      imageCategory = 'radiofrecuencia';
    } else if (topicLower.includes('hifu') || topicLower.includes('ultrason') || topicLower.includes('focalizad')) {
      imageCategory = 'hifu';
    } else if (topicLower.includes('diagnóst') || topicLower.includes('análisis') || topicLower.includes('evaluac')) {
      imageCategory = 'diagnostico';
    } else {
      imageCategory = 'diagnostico'; // Default para técnico
    }
    
    const images = TECHNICAL_IMAGES[imageCategory] || TECHNICAL_IMAGES.diagnostico;
    return images[Math.floor(Math.random() * images.length)];
  }
  
  // Fallback image
  return 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&crop=face';
}

// Función para generar imágenes alternativas si falla la principal
export function getFallbackImages(category) {
  if (category === 'medico-estetico') {
    return [
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop&crop=face',
      '/images/services/hidratacionProfunda/hidraProf.jpg'
    ];
  } else {
    return [
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop&crop=entropy',
      'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&h=600&fit=crop&crop=entropy',
      '/images/productos/dispositivos/led/led1.jpg'
    ];
  }
}

export default { getBlogImage, getFallbackImages };