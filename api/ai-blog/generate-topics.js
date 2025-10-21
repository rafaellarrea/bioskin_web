// api/ai-blog/generate-topics.js
// Endpoint para generar temas sugeridos frescos con IA

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
    return res.status(500).json({
      success: false,
      message: 'Configuración de IA no válida. Verificar OPENAI_API_KEY',
      endpoint: '/api/ai-blog/generate-topics'
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
    console.log(`🎯 Generando temas frescos para categoría: ${category}`);

    // Prompts específicos para cada categoría
    const prompts = {
      'medico-estetico': `Genera 5 temas innovadores y específicos para blogs de medicina estética. Los temas deben ser:
      - Actuales y relevantes para 2025
      - Específicos (no genéricos)
      - Relacionados con tratamientos, procedimientos o tendencias
      - Atractivos para pacientes interesados en estética
      
      Ejemplos de formato:
      - "Combinación de ácido hialurónico con bioestimuladores: protocolo 2025"
      - "Microagujas con PRP vs. tradicional: resultados comparativos"
      
      Devuelve solo la lista de 5 temas, uno por línea, sin numeración ni viñetas.`,
      
      'tecnico': `Genera 5 temas técnicos innovadores para blogs sobre equipamiento y tecnología médica estética. Los temas deben ser:
      - Técnicos pero comprensibles
      - Sobre equipos, tecnologías o protocolos específicos
      - Actuales para 2025
      - Útiles para profesionales médicos estéticos
      
      Ejemplos de formato:
      - "Calibración avanzada de equipos IPL: nuevos estándares FDA 2025"
      - "Análisis comparativo: HIFU focal vs. HIFU lineal en resultados"
      
      Devuelve solo la lista de 5 temas, uno por línea, sin numeración ni viñetas.`
    };

    // Generar temas con OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres un especialista en medicina estética que genera temas innovadores y específicos para blogs profesionales."
        },
        {
          role: "user",
          content: prompts[category]
        }
      ],
      max_tokens: 500,
      temperature: 0.8 // Más creatividad para temas variados
    });

    const generatedContent = completion.choices[0].message.content;
    
    // Procesar los temas generados
    const topics = generatedContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 10) // Filtrar líneas muy cortas
      .slice(0, 5); // Asegurar máximo 5 temas

    console.log(`✅ Generados ${topics.length} temas frescos para ${category}`);

    res.status(200).json({
      success: true,
      topics: topics,
      category: category,
      message: `${topics.length} temas frescos generados exitosamente`,
      meta: {
        endpoint: '/api/ai-blog/generate-topics',
        timestamp: new Date().toISOString(),
        model: 'gpt-4o-mini',
        temperature: 0.8
      }
    });

  } catch (error) {
    console.error('Error generando temas:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error generando temas con IA',
      error: {
        message: error.message,
        name: error.name
      },
      endpoint: '/api/ai-blog/generate-topics'
    });
  }
}