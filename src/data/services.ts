/**
 * BIOSKIN - Catálogo Centralizado de Servicios Médico-Estéticos
 * 
 * FUENTE ÚNICA DE VERDAD para todos los servicios
 * - Usado por la página web (Services.tsx)
 * - Usado por el chatbot de WhatsApp (via services-adapter.js)
 * 
 * Reemplaza:
 * - Array hardcodeado en src/pages/Services.tsx
 * - lib/treatments-data.js
 */

export interface Service {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  price: string;
  duration: string;
  category: 'evaluacion' | 'facial' | 'corporal' | 'laser' | 'inyectable' | 'avanzado';
  keywords: string[];
  image: string;
  popular: boolean;
  benefits?: string[];
  indications?: string[];
}

export const services: Service[] = [
  // EVALUACIÓN
  {
    id: 'consulta-medica',
    title: 'Consulta Médica Estética',
    shortDescription: 'Evaluación profesional personalizada',
    description: 'Consulta médica completa con evaluación de piel, diagnóstico personalizado y plan de tratamiento recomendado por nuestros especialistas.',
    price: '$10',
    duration: '30 minutos',
    category: 'evaluacion',
    keywords: ['consulta', 'evaluacion', 'diagnostico', 'medica', 'estetica', 'valoracion'],
    image: '/images/services/consulta-medica.jpg',
    popular: false,
    benefits: [
      'Diagnóstico profesional de tu piel',
      'Plan de tratamiento personalizado',
      'Recomendaciones de especialistas'
    ]
  },
  {
    id: 'consulta-escaner',
    title: 'Consulta + Escáner Facial',
    shortDescription: 'Evaluación avanzada con tecnología',
    description: 'Consulta médica con análisis facial computarizado que evalúa manchas, arrugas, poros, hidratación y otros parámetros de la piel.',
    price: '$10',
    duration: '45 minutos',
    category: 'evaluacion',
    keywords: ['consulta', 'escaner', 'analizador', 'facial', 'diagnostico', 'tecnologia'],
    image: '/images/services/escaner-facial.jpg',
    popular: false,
    benefits: [
      'Análisis computarizado de la piel',
      'Detección de manchas y arrugas',
      'Medición de hidratación y elasticidad'
    ]
  },

  // TRATAMIENTOS FACIALES
  {
    id: 'limpieza-facial',
    title: 'Limpieza Facial Profunda',
    shortDescription: 'Limpieza profesional de cutis',
    description: 'Limpieza facial profunda con extracción de impurezas, exfoliación, tonificación y mascarilla revitalizante. Deja la piel limpia, fresca y radiante.',
    price: '$25',
    duration: '90 minutos',
    category: 'facial',
    keywords: ['limpieza', 'facial', 'cutis', 'exfoliacion', 'mascarilla', 'poros'],
    image: '/images/services/limpieza-facial.jpg',
    popular: true,
    benefits: [
      'Eliminación profunda de impurezas',
      'Desobstrucción de poros',
      'Piel más luminosa y fresca'
    ],
    indications: [
      'Todo tipo de piel',
      'Piel con impurezas o puntos negros',
      'Mantenimiento mensual recomendado'
    ]
  },
  {
    id: 'limpieza-crioradio',
    title: 'Limpieza Facial + Crioradiofrecuencia',
    shortDescription: 'Limpieza con tecnología reafirmante',
    description: 'Limpieza facial profunda combinada con crioradiofrecuencia para reafirmar, tensar y rejuvenecer la piel del rostro.',
    price: '$30',
    duration: '120 minutos',
    category: 'facial',
    keywords: ['limpieza', 'crioradio', 'radiofrecuencia', 'reafirmante', 'tensor'],
    image: '/images/services/crioradio.jpg',
    popular: false,
    benefits: [
      'Limpieza profunda + reafirmación',
      'Efecto tensor inmediato',
      'Estimula producción de colágeno'
    ]
  },
  {
    id: 'hidratacion-profunda',
    title: 'Hidratación Profunda',
    shortDescription: 'Hidratación intensiva para tu piel',
    description: 'Tratamiento de hidratación profunda con ácido hialurónico y vitaminas que devuelve la luminosidad y suavidad a la piel.',
    price: '$35',
    duration: '60 minutos',
    category: 'facial',
    keywords: ['hidratacion', 'acido', 'hialuronico', 'vitaminas', 'humectante'],
    image: '/images/services/hidratacion.jpg',
    popular: true,
    benefits: [
      'Hidratación profunda de la piel',
      'Restaura luminosidad natural',
      'Efecto suavizante inmediato'
    ]
  },
  {
    id: 'antiaging',
    title: 'Tratamiento Antiaging',
    shortDescription: 'Combate los signos del envejecimiento',
    description: 'Tratamiento completo antiedad con productos de última generación que reducen arrugas, líneas de expresión y mejoran la elasticidad de la piel.',
    price: '$25',
    duration: '60 minutos',
    category: 'facial',
    keywords: ['antiaging', 'antiedad', 'arrugas', 'rejuvenecimiento', 'lineas'],
    image: '/images/services/antiaging.jpg',
    popular: true,
    benefits: [
      'Reducción de arrugas y líneas',
      'Mejora elasticidad de la piel',
      'Efecto rejuvenecedor visible'
    ]
  },
  {
    id: 'antimanchas',
    title: 'Tratamiento Antimanchas',
    shortDescription: 'Elimina manchas y unifica el tono',
    description: 'Tratamiento especializado para reducir y eliminar manchas, hiperpigmentación y unificar el tono de la piel.',
    price: '$30',
    duration: '90 minutos',
    category: 'facial',
    keywords: ['antimanchas', 'manchas', 'pigmentacion', 'melasma', 'despigmentante'],
    image: '/images/services/antimanchas.jpg',
    popular: true,
    benefits: [
      'Reduce manchas oscuras',
      'Unifica el tono de la piel',
      'Previene nueva hiperpigmentación'
    ],
    indications: [
      'Manchas solares',
      'Melasma',
      'Hiperpigmentación post-inflamatoria'
    ]
  },
  {
    id: 'microneedling',
    title: 'Microneedling',
    shortDescription: 'Regeneración celular avanzada',
    description: 'Tratamiento de microagujas que estimula la producción natural de colágeno y elastina, mejorando textura, cicatrices y arrugas.',
    price: '$30',
    duration: '60 minutos',
    category: 'facial',
    keywords: ['microneedling', 'microagujas', 'colageno', 'cicatrices', 'textura'],
    image: '/images/services/microneedling.jpg',
    popular: false,
    benefits: [
      'Estimula colágeno natural',
      'Mejora textura de la piel',
      'Reduce cicatrices y poros'
    ]
  },
  {
    id: 'tratamiento-acne',
    title: 'Tratamiento Integral Anti-Acné',
    shortDescription: 'Control y eliminación de acné activo',
    description: 'Tratamiento personalizado para combatir el acné activo y sus secuelas. Combina técnicas como mesoterapia con activos seborreguladores y bactericidas, IPL y Crioradiofrecuencia según la necesidad del paciente.',
    price: '$25 (variable según evaluación)',
    duration: '1 hora 45 minutos',
    category: 'facial',
    keywords: ['acne', 'acné', 'granos', 'espinillas', 'barros', 'brotes', 'imperfecciones', 'seborrea', 'grasa', 'pustulas'],
    image: '/images/services/tratamiento-acne.jpg',
    popular: true,
    benefits: [
      'Control de la producción de grasa',
      'Eliminación de bacterias causantes del acné',
      'Reducción de inflamación y rojeces',
      'Prevención de cicatrices y marcas'
    ],
    indications: [
      'Acné activo (leve, moderado o severo)',
      'Piel grasa o seborreica',
      'Poros dilatados y obstruidos'
    ]
  },

  // TRATAMIENTOS LÁSER
  {
    id: 'laser-co2',
    title: 'Láser CO2 Fraccionado',
    shortDescription: 'Rejuvenecimiento láser avanzado',
    description: 'Tratamiento láser CO2 fraccionado para rejuvenecimiento profundo, eliminación de cicatrices, arrugas y manchas.',
    price: '$150',
    duration: '90 minutos',
    category: 'laser',
    keywords: ['laser', 'co2', 'fraccionado', 'rejuvenecimiento', 'cicatrices'],
    image: '/images/services/laser-co2.jpg',
    popular: false,
    benefits: [
      'Rejuvenecimiento profundo',
      'Elimina cicatrices de acné',
      'Resultados duraderos'
    ],
    indications: [
      'Cicatrices de acné',
      'Arrugas profundas',
      'Manchas resistentes'
    ]
  },
  {
    id: 'ipl',
    title: 'IPL (Luz Pulsada Intensa)',
    shortDescription: 'Fotorrejuvenecimiento avanzado',
    description: 'Tratamiento de luz pulsada intensa para manchas, rojeces, venitas y fotorrejuvenecimiento facial.',
    price: '$25',
    duration: '45 minutos',
    category: 'laser',
    keywords: ['ipl', 'luz', 'pulsada', 'fotorrejuvenecimiento', 'manchas', 'venitas'],
    image: '/images/services/ipl.jpg',
    popular: false,
    benefits: [
      'Elimina manchas y rojeces',
      'Reduce venitas faciales',
      'Mejora textura general'
    ]
  },
  {
    id: 'hollywood-peel',
    title: 'Hollywood Peel',
    shortDescription: 'El tratamiento de las estrellas',
    description: 'Láser de carbón activado que elimina impurezas, reduce poros, controla grasa y proporciona luminosidad instantánea.',
    price: '$30',
    duration: '90 minutos',
    category: 'laser',
    keywords: ['hollywood', 'peel', 'laser', 'carbon', 'poros', 'luminosidad'],
    image: '/images/services/hollywood-peel.jpg',
    popular: true,
    benefits: [
      'Luminosidad instantánea',
      'Reduce poros y controla grasa',
      'Sin tiempo de recuperación'
    ]
  },
  {
    id: 'remocion-tatuajes',
    title: 'Remoción de Tatuajes',
    shortDescription: 'Eliminación segura de tatuajes',
    description: 'Tratamiento láser Q-Switched para eliminación segura y efectiva de tatuajes de todos los colores.',
    price: '$15',
    duration: 'Variable según tamaño',
    category: 'laser',
    keywords: ['remocion', 'tatuajes', 'laser', 'qswitched', 'eliminacion'],
    image: '/images/services/remocion-tatuajes.jpg',
    popular: false,
    benefits: [
      'Eliminación efectiva',
      'Seguro para la piel',
      'Resultados progresivos'
    ]
  },

  // TRATAMIENTOS CORPORALES
  {
    id: 'hifu',
    title: 'HIFU 7D',
    shortDescription: 'Lifting sin cirugía',
    description: 'Ultrasonido focalizado de alta intensidad para lifting facial y corporal no invasivo, con resultados similares a cirugía.',
    price: '$60',
    duration: '90 minutos',
    category: 'corporal',
    keywords: ['hifu', 'ultrasonido', 'lifting', 'tensor', 'flacidez'],
    image: '/images/services/hifu.jpg',
    popular: false,
    benefits: [
      'Lifting sin cirugía',
      'Reafirma y tensa',
      'Resultados duraderos'
    ],
    indications: [
      'Flacidez facial o corporal',
      'Alternativa a cirugía',
      'Resultados naturales'
    ]
  },
  {
    id: 'lipopapada',
    title: 'Lipopapada Enzimática',
    shortDescription: 'Elimina grasa de papada',
    description: 'Tratamiento enzimático no invasivo para eliminar grasa localizada en papada y definir el contorno facial.',
    price: '$30',
    duration: '60 minutos',
    category: 'corporal',
    keywords: ['lipopapada', 'enzimatica', 'papada', 'grasa', 'contorno'],
    image: '/images/services/lipopapada.jpg',
    popular: true,
    benefits: [
      'Elimina grasa de papada',
      'Sin cirugía ni anestesia',
      'Define el contorno facial'
    ]
  },

  // TRATAMIENTOS INYECTABLES
  {
    id: 'prp',
    title: 'PRP (Plasma Rico en Plaquetas)',
    shortDescription: 'Regeneración con tu propia sangre',
    description: 'Tratamiento de bioestimulación con plasma rico en plaquetas para regenerar la piel, reducir arrugas y mejorar calidad cutánea.',
    price: '$30',
    duration: '60 minutos',
    category: 'inyectable',
    keywords: ['prp', 'plasma', 'plaquetas', 'bioestimulacion', 'regeneracion'],
    image: '/images/services/prp.jpg',
    popular: false,
    benefits: [
      'Estimula regeneración natural',
      'Mejora calidad de la piel',
      'Tratamiento biocompatible'
    ]
  },
  {
    id: 'bioestimuladores',
    title: 'Bioestimuladores de Colágeno',
    shortDescription: 'Estimulación profunda de colágeno',
    description: 'Inyección de bioestimuladores (Sculptra, Radiesse) que activan la producción de colágeno propio para rejuvenecimiento progresivo.',
    price: '$250',
    duration: '45 minutos',
    category: 'inyectable',
    keywords: ['bioestimuladores', 'colageno', 'sculptra', 'radiesse', 'rejuvenecimiento'],
    image: '/images/services/bioestimuladores.jpg',
    popular: false,
    benefits: [
      'Rejuvenecimiento progresivo',
      'Resultados naturales',
      'Efecto duradero'
    ]
  },
  {
    id: 'relleno-labios',
    title: 'Relleno de Labios',
    shortDescription: 'Labios perfectos y naturales',
    description: 'Aumento y perfilado de labios con ácido hialurónico para lograr labios más voluminosos y definidos de forma natural.',
    price: '$160',
    duration: '30 minutos',
    category: 'inyectable',
    keywords: ['relleno', 'labios', 'acido', 'hialuronico', 'aumento', 'perfilado'],
    image: '/images/services/relleno-labios.jpg',
    popular: false,
    benefits: [
      'Aumento de volumen',
      'Perfilado natural',
      'Resultados inmediatos'
    ]
  },

  // TRATAMIENTOS AVANZADOS
  {
    id: 'exosomas',
    title: 'Exosomas + Mesoterapia',
    shortDescription: 'Regeneración celular avanzada',
    description: 'Tratamiento de última generación con exosomas para regeneración celular profunda, combinado con mesoterapia para máxima efectividad.',
    price: '$150',
    duration: '60 minutos',
    category: 'avanzado',
    keywords: ['exosomas', 'mesoterapia', 'regeneracion', 'celular', 'avanzado'],
    image: '/images/services/exosomas.jpg',
    popular: true,
    benefits: [
      'Regeneración celular profunda',
      'Tecnología de vanguardia',
      'Resultados visibles rápidamente'
    ]
  },
  {
    id: 'nctf',
    title: 'NCTF + Mesoterapia',
    shortDescription: 'Revitalización integral',
    description: 'Cóctel revitalizante NCTF con 55 ingredientes activos combinado con mesoterapia para una revitalización profunda de la piel.',
    price: '$150',
    duration: '60 minutos',
    category: 'avanzado',
    keywords: ['nctf', 'mesoterapia', 'revitalizacion', 'coctel', 'antiedad'],
    image: '/images/services/nctf.jpg',
    popular: true,
    benefits: [
      'Revitalización profunda',
      'Hidratación intensa',
      'Efecto antiedad inmediato'
    ]
  }
];

// ============================================================================
// CAPA DE COMPATIBILIDAD - Para código existente que usa TREATMENTS_CATALOG
// ============================================================================

export const TREATMENTS_CATALOG = {
  evaluation: services.filter(s => s.category === 'evaluacion'),
  cleaning: services.filter(s => ['limpieza-facial', 'limpieza-crioradio'].includes(s.id)),
  regeneration: services.filter(s => ['microneedling', 'prp', 'bioestimuladores', 'exosomas'].includes(s.id)),
  laser: services.filter(s => s.category === 'laser'),
  advanced: services.filter(s => ['hifu', 'relleno-labios', 'antimanchas', 'nctf', 'lipopapada'].includes(s.id))
};

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Obtiene todos los servicios
 */
export function getAllServices(): Service[] {
  return services;
}

/**
 * Obtiene servicios populares
 */
export function getPopularServices(): Service[] {
  return services.filter(s => s.popular);
}

/**
 * Busca un servicio por palabra clave
 */
export function findServiceByKeyword(keyword: string): Service | null {
  const searchTerm = keyword.toLowerCase().trim();
  
  return services.find(service => 
    service.keywords.some(k => k.includes(searchTerm)) ||
    service.title.toLowerCase().includes(searchTerm) ||
    service.shortDescription.toLowerCase().includes(searchTerm)
  ) || null;
}

/**
 * Busca servicios que coincidan con un término (puede devolver múltiples)
 */
export function searchServices(searchTerm: string): Service[] {
  const term = searchTerm.toLowerCase().trim();
  
  return services.filter(service =>
    service.keywords.some(k => k.includes(term)) ||
    service.title.toLowerCase().includes(term) ||
    service.shortDescription.toLowerCase().includes(term) ||
    service.description.toLowerCase().includes(term)
  );
}

/**
 * Obtiene servicios por categoría
 */
export function getServicesByCategory(category: Service['category']): Service[] {
  return services.filter(s => s.category === category);
}

/**
 * Genera texto del catálogo para el chatbot
 */
export function generateCatalogText(): string {
  let text = '📋 *CATÁLOGO DE SERVICIOS BIOSKIN*\n\n';
  
  const categories = {
    evaluacion: '🔍 EVALUACIÓN',
    facial: '✨ TRATAMIENTOS FACIALES',
    laser: '⚡ TRATAMIENTOS LÁSER',
    corporal: '💪 TRATAMIENTOS CORPORALES',
    inyectable: '💉 TRATAMIENTOS INYECTABLES',
    avanzado: '🚀 TRATAMIENTOS AVANZADOS'
  };
  
  Object.entries(categories).forEach(([catKey, catName]) => {
    const categoryServices = services.filter(s => s.category === catKey);
    if (categoryServices.length > 0) {
      text += `*${catName}*\n`;
      categoryServices.forEach(service => {
        text += `• ${service.title} - ${service.price} (${service.duration})\n`;
      });
      text += '\n';
    }
  });
  
  return text;
}

export default services;
