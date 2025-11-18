/**
 * DATOS CENTRALIZADOS DE TRATAMIENTOS DE BIOSKIN
 * Fuente única de verdad para todos los servicios
 */

const TREATMENTS_CATALOG = {
  evaluation: [
    {
      name: 'Consulta médica',
      price: 10,
      duration: 30,
      description: 'Evaluación médica profesional',
      keywords: ['consulta', 'evaluacion', 'evaluación']
    },
    {
      name: 'Consulta + escáner facial',
      price: 10,
      duration: 30,
      description: 'Evaluación facial completa con escaneo',
      keywords: ['escaner', 'escaneo', 'scanner']
    }
  ],

  cleaning: [
    {
      name: 'Limpieza facial profunda',
      price: 25,
      duration: 90,
      description: 'Higiene profunda, extracción, exfoliación',
      keywords: ['limpieza', 'facial', 'higiene']
    },
    {
      name: 'Limpieza facial + crioradiofrecuencia',
      price: 30,
      duration: 90,
      description: 'Limpieza profunda con tecnología avanzada',
      keywords: ['crioradiofrecuencia', 'criofrecuencia']
    }
  ],

  regeneration: [
    {
      name: 'Microneedling',
      price: 30,
      duration: 60,
      description: 'Estimulación de colágeno, mejora textura y cicatrices',
      keywords: ['microneedling', 'microagujas', 'colageno']
    },
    {
      name: 'PRP (Plasma Rico en Plaquetas)',
      price: 30,
      duration: 45,
      description: 'Bioestimulación natural',
      keywords: ['prp', 'plasma', 'plaquetas']
    },
    {
      name: 'Bioestimuladores de colágeno',
      price: 250,
      duration: 45,
      description: 'Estimulación profunda de colágeno',
      keywords: ['bioestimuladores', 'bioestimulador']
    },
    {
      name: 'Exosomas',
      price: 130,
      duration: 60,
      description: 'Tecnología avanzada de regeneración',
      keywords: ['exosomas', 'exosoma']
    }
  ],

  laser: [
    {
      name: 'Láser CO2',
      price: 150,
      duration: 90,
      description: 'Rejuvenecimiento profundo, cicatrices, estrías',
      keywords: ['laser co2', 'láser co2', 'co2']
    },
    {
      name: 'IPL facial (Rejuvenecimiento)',
      price: 25,
      duration: 60,
      description: 'Tratamiento de manchas y luminosidad',
      keywords: ['ipl', 'luz pulsada', 'manchas', 'pigmentacion']
    },
    {
      name: 'Hollywood peel',
      price: 35,
      duration: 90,
      description: 'Tecnología avanzada de regeneración',
      keywords: ['hollywood', 'peel']
    },
    {
      name: 'Eliminación de tatuajes',
      price: 15,
      duration: '45-60',
      description: 'Precio según tamaño, color y antigüedad',
      keywords: ['tatuaje', 'tatuajes', 'eliminacion']
    }
  ],

  advanced: [
    {
      name: 'HIFU full face',
      price: 60,
      duration: 120,
      description: 'Lifting sin cirugía, tensión facial',
      keywords: ['hifu', 'lifting', 'ultrasonido']
    },
    {
      name: 'Relleno de labios',
      price: 160,
      duration: 60,
      description: 'Ácido hialurónico, volumen y contorno',
      keywords: ['relleno', 'labios', 'hialuronico']
    },
    {
      name: 'Tratamiento despigmentante',
      price: 30,
      duration: 90,
      description: 'Tratamiento de manchas y pigmentación',
      keywords: ['despigmentante', 'manchas', 'melasma']
    }
  ]
};

/**
 * Obtiene todos los tratamientos en una lista plana
 */
function getAllTreatments() {
  return Object.values(TREATMENTS_CATALOG).flat();
}

/**
 * Busca un tratamiento por palabra clave
 */
function findTreatmentByKeyword(keyword) {
  const lowerKeyword = keyword.toLowerCase();
  const allTreatments = getAllTreatments();
  
  return allTreatments.find(treatment => 
    treatment.keywords.some(k => lowerKeyword.includes(k))
  );
}

/**
 * Genera el texto del catálogo para el prompt del chatbot
 */
function generateCatalogText() {
  return `💆 TRATAMIENTOS PRINCIPALES:

Evaluación:
${TREATMENTS_CATALOG.evaluation.map(t => 
  `• ${t.name}: $${t.price} (${t.duration} min)`
).join('\n')}

Limpieza:
${TREATMENTS_CATALOG.cleaning.map(t => 
  `• ${t.name}: $${t.price} (${t.duration} min)`
).join('\n')}

Regeneración:
${TREATMENTS_CATALOG.regeneration.map(t => 
  `• ${t.name}: $${t.price} (${t.duration} min) - ${t.description}`
).join('\n')}

Láser:
${TREATMENTS_CATALOG.laser.map(t => 
  `• ${t.name}: $${typeof t.price === 'number' ? t.price : 'desde $' + t.price} (${t.duration} min) - ${t.description}`
).join('\n')}

Avanzados:
${TREATMENTS_CATALOG.advanced.map(t => 
  `• ${t.name}: $${t.price} (${t.duration} min) - ${t.description}`
).join('\n')}`;
}

/**
 * Lista de palabras clave para extracción en mensajes
 */
function getTreatmentKeywords() {
  return getAllTreatments().map(t => t.name.toLowerCase());
}

module.exports = {
  TREATMENTS_CATALOG,
  getAllTreatments,
  findTreatmentByKeyword,
  generateCatalogText,
  getTreatmentKeywords
};
