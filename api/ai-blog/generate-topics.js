// api/ai-blog/generate-topics.js
// 🎯 GENERADOR AVANZADO DE TEMAS ÚNICOS E INNOVADORES

import OpenAI from 'openai';

// Configurar OpenAI
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
} catch (error) {
  console.error('Error configurando OpenAI:', error);
}

/**
 * Contextos dinámicos para máxima variación
 */
const DYNAMIC_CONTEXTS = {
  medical: [
    'investigaciones Harvard 2025', 'protocolos Stanford Medicine', 'estudios Mayo Clinic',
    'avances Seoul National University', 'investigación biomédica MIT', 'ensayos clínicos FDA',
    'medicina de precisión Johns Hopkins', 'bioingeniería ETH Zurich', 'nanomedicina Oxford'
  ],
  
  technical: [
    'especificaciones ISO 13485:2025', 'normativas CE actualizadas', 'estándares FDA-510k',
    'certificaciones IEC 60601', 'validación NIST', 'protocolos AAMI',
    'compliance HIPAA-GDPR', 'algoritmos machine learning médico', 'IoMT security standards'
  ],
  
  innovations: [
    'inteligencia artificial médica', 'realidad aumentada quirúrgica', 'nanosensores dérmicos',
    'bioimpresión 3D cellular', 'terapia génica estética', 'medicina cuántica aplicada',
    'robótica médica mínimamente invasiva', 'biotecnología regenerativa', 'criobiopreservación'
  ],
  
  trending: [
    'longevidad celular 2025', 'medicina espacial aplicada', 'biohacking científico',
    'epigenética estética', 'microbioma cutáneo', 'fotobiomodulación avanzada',
    'neuroplasticidad estética', 'cronobiología médica', 'medicina circadiana'
  ]
};

/**
 * Genera prompt ultra-específico y único para cada categoría
 */
function generateUltraSpecificPrompt(category) {
  const timestamp = new Date();
  const year = timestamp.getFullYear();
  const month = timestamp.getMonth() + 1;
  const day = timestamp.getDate();
  
  // Seleccionar contextos aleatorios para máxima variación
  const medicalCtx = DYNAMIC_CONTEXTS.medical[Math.floor(Math.random() * DYNAMIC_CONTEXTS.medical.length)];
  const technicalCtx = DYNAMIC_CONTEXTS.technical[Math.floor(Math.random() * DYNAMIC_CONTEXTS.technical.length)];
  const innovationCtx = DYNAMIC_CONTEXTS.innovations[Math.floor(Math.random() * DYNAMIC_CONTEXTS.innovations.length)];
  const trendingCtx = DYNAMIC_CONTEXTS.trending[Math.floor(Math.random() * DYNAMIC_CONTEXTS.trending.length)];
  
  // Números aleatorios para especificidad
  const randomPercentage = Math.floor(Math.random() * 40) + 60; // 60-100%
  const randomStudySize = Math.floor(Math.random() * 900) + 100; // 100-1000 pacientes
  const randomWavelength = Math.floor(Math.random() * 500) + 600; // 600-1100nm
  const randomFrequency = Math.floor(Math.random() * 20) + 1; // 1-20 MHz
  
  const prompts = {
    'medico-estetico': `
      Eres un investigador médico de élite especializando en medicina estética regenerativa.
      
      CONTEXTO ESPECÍFICO DEL ${day}/${month}/${year}:
      - Investigación base: ${medicalCtx}
      - Innovación focal: ${innovationCtx}
      - Tendencia emergente: ${trendingCtx}
      - Datos de referencia: ${randomStudySize} pacientes, ${randomPercentage}% eficacia
      
      MISIÓN CRÍTICA: Genera 6 títulos de blog REVOLUCIONARIOS que:
      
      ✅ INCLUYAN DATOS NUMÉRICOS ESPECÍFICOS (%, nm, MHz, meses, pacientes)
      ✅ COMBINEN 2-3 TECNOLOGÍAS DIFERENTES en un mismo título
      ✅ REFERENCIEN investigaciones reales de 2024-2025
      ✅ MENCIONEN protocolos específicos o algoritmos
      ✅ EVITEN completamente palabras como "beneficios", "qué es", "cómo funciona"
      ✅ INTEGREN conceptos de ${innovationCtx} con medicina estética
      
      EJEMPLOS DE REVOLUCIONARIO:
      "Protocolo Stanford 2025: Exosomas + HIFU 4MHz para regeneración celular en 72h"
      "Nanosensores dérmicos con IA: predicción de envejecimiento 89% precisión"
      "Láser picosegundo ${randomWavelength}nm + bioimpresión 3D: restauración cicatricial completa"
      
      FORMATO OBLIGATORIO: Lista numerada 1-6, títulos entre 10-18 palabras
      RESTRICCIÓN: CERO repetición de conceptos entre títulos
    `,
    
    'tecnico': `
      Eres un ingeniero biomédico senior con especialización en dispositivos médico-estéticos avanzados.
      
      ESPECIFICACIONES TÉCNICAS DEL ${day}/${month}/${year}:
      - Estándar de referencia: ${technicalCtx}
      - Framework técnico: ${innovationCtx}
      - Tendencia tecnológica: ${trendingCtx}
      - Parámetros: ${randomFrequency}MHz, ${randomWavelength}nm, ${randomPercentage}% eficiencia
      
      OBJETIVO TÉCNICO: Genera 6 títulos ULTRA-ESPECÍFICOS que:
      
      ✅ INCLUYAN especificaciones técnicas exactas (MHz, nm, W, °C, Hz)
      ✅ REFERENCIEN estándares específicos (ISO, IEC, FDA, CE)
      ✅ MENCIONEN algoritmos, software o protocolos de calibración
      ✅ COMBINEN múltiples tecnologías en análisis comparativo
      ✅ INCLUYAN metodologías de validación o testing
      ✅ INTEGREN conceptos de ${innovationCtx} en dispositivos médicos
      
      EJEMPLOS TÉCNICOS AVANZADOS:
      "Algoritmo FFT para optimización automática de radiofrecuencia ${randomFrequency}MHz: validación ISO 13485"
      "Análisis espectral de diodos LED 630-${randomWavelength}nm: eficiencia cuántica vs temperatura"
      "Sistema de feedback dinámico HIFU con sensores piezoeléctricos: protocolo calibración"
      
      FORMATO OBLIGATORIO: Lista numerada 1-6, incluir especificaciones técnicas
      RESTRICCIÓN: Máxima precisión técnica, cero generalidades
    `
  };
  
  return prompts[category] || prompts['medico-estetico'];
}

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido. Use POST.'
    });
  }

  // Validar OpenAI
  if (!openai || !process.env.OPENAI_API_KEY) {
    console.log('⚠️ OpenAI no disponible, usando temas fallback únicos');
    return res.status(200).json({
      success: true,
      topics: generateUniqueMultilevel2024Topics(req.body.category || 'medico-estetico'),
      category: req.body.category || 'medico-estetico',
      source: 'unique-fallback-system',
      message: 'Temas únicos generados sin IA (fallback avanzado)'
    });
  }

  const { category } = req.body;

  if (!category || !['medico-estetico', 'tecnico'].includes(category)) {
    return res.status(400).json({
      success: false,
      message: 'Categoría requerida: medico-estetico o tecnico'
    });
  }

  try {
    console.log(`🎯 Generando temas REVOLUCIONARIOS para: ${category}`);

    const ultraSpecificPrompt = generateUltraSpecificPrompt(category);

    // Usar parámetros optimizados para máxima creatividad y unicidad
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres un especialista de élite en medicina estética e ingeniería biomédica. Generas ÚNICAMENTE contenido revolucionario, específico y técnicamente avanzado. NUNCA repites conceptos generales o títulos similares a contenido existente.`
        },
        {
          role: "user",
          content: ultraSpecificPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.95,    // Máxima creatividad
      top_p: 0.9,          // Diversidad alta
      frequency_penalty: 1.5, // Evitar repeticiones
      presence_penalty: 1.3   // Promover conceptos nuevos
    });

    const generatedContent = completion.choices[0].message.content;
    
    // Procesar los temas con mejor extracción
    const titleRegex = /\d+\.\s*(.+?)(?=\n\d+\.|$)/gs;
    const matches = [...generatedContent.matchAll(titleRegex)];
    let topics = matches.map(match => match[1].trim().replace(/["""]/g, ''));
    
    // Si no encuentra suficientes con regex, usar split alternativo
    if (topics.length < 3) {
      topics = generatedContent
        .split('\n')
        .filter(line => line.trim().length > 15)
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 15)
        .slice(0, 6);
    }

    console.log(`✅ Generados ${topics.length} temas ÚNICOS:`, topics);

    res.status(200).json({
      success: true,
      topics: topics.slice(0, 6),
      category: category,
      uniqueness_score: calculateTopicUniqueness(topics),
      generation_method: 'ultra-specific-ai',
      meta: {
        timestamp: new Date().toISOString(),
        model: 'gpt-4o-mini',
        creativity_params: { temp: 0.95, top_p: 0.9, freq_pen: 1.5 }
      }
    });

  } catch (error) {
    console.error('Error generando temas únicos:', error);
    
    // Fallback avanzado con temas únicos
    res.status(200).json({
      success: true,
      topics: generateUniqueMultilevel2024Topics(category),
      category: category,
      source: 'advanced-fallback',
      message: 'Temas únicos generados con sistema de fallback avanzado'
    });
  }
}

/**
 * Sistema de fallback que genera temas únicos sin IA
 */
function generateUniqueMultilevel2024Topics(category) {
  const timestamp = Date.now();
  const randomSeed = Math.floor(Math.random() * 10000);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const advanced2024Topics = {
    'medico-estetico': [
      `Protocolo MIT ${currentYear}: Exosomas fotobiomodulados 660nm + HIFU para regeneración 72h`,
      `Análisis Harvard: Microagujas ${randomSeed}μm + nanopartículas HA, eficacia 94% en ${currentMonth} meses`,
      `Bioimpresión 3D dérmica: Scaffold colágeno tipo I-III para cicatrices, resultados Mayo Clinic`,
      `IA predictiva + láser picosegundo: personalización automática según fototipo IV-VI`,
      `Cronobiología estética: protocolos circadianos para optimizar regeneración celular 89%`,
      `Nanosensores cutáneos + realidad aumentada: mapeo 3D del envejecimiento dérmico`
    ],
    
    'tecnico': [
      `Validación IEC 60601-2-57: Sistemas HIFU con feedback piezoeléctrico, calibración automática`,
      `Análisis FFT de armónicos en RF monopolar ${randomSeed}kHz: optimización impedancia tisular`,
      `Protocolo FDA-510k para láser diodo 808nm: metodología de testing térmico avanzado`,
      `Sistema de control adaptativo para IPL 515-1200nm: algoritmo ML de predicción espectral`,
      `Certificación ISO 13485: Dispositivos con sensores IoT, ciberseguridad médica aplicada`,
      `Comparativa metrológica: Termografía infrarroja vs sensores piezoresistivos en RF`
    ]
  };
  
  return advanced2024Topics[category] || advanced2024Topics['medico-estetico'];
}

/**
 * Calcula score de unicidad de temas generados
 */
function calculateTopicUniqueness(topics) {
  const commonTerms = ['tratamiento', 'beneficios', 'qué es', 'cómo', 'mejor', 'nuevo'];
  let uniquenessScore = 100;
  
  topics.forEach(topic => {
    const lowerTopic = topic.toLowerCase();
    commonTerms.forEach(term => {
      if (lowerTopic.includes(term)) {
        uniquenessScore -= 8;
      }
    });
    
    // Bonus por especificidad técnica
    if (/\d+%|\d+nm|\d+MHz|\d+kHz|\d+μm/.test(topic)) {
      uniquenessScore += 10;
    }
  });
  
  return Math.min(Math.max(uniquenessScore, 30), 100);
}