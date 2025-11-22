/**
 * SERVICIO DE IA PARA CONSULTAS MÉDICO-ESTÉTICAS - BIOSKIN
 * 
 * Clasificación y respuesta inteligente para consultas sobre:
 * - Tratamientos faciales y corporales
 * - Problemas estéticos (manchas, arrugas, acné, etc.)
 * - Inyectables (botox, rellenos)
 * - Procedimientos láser
 * - Rejuvenecimiento y anti-aging
 * - Consultas de evaluación
 * 
 * Prioriza generación dinámica con IA sobre respuestas predefinidas
 * 
 * ========================================
 * TESTS DE EJEMPLO Y CASOS DE USO
 * ========================================
 * 
 * CASO A: Usuario muestra interés en tratamiento específico
 * Input: "Me interesa tratamiento antimanchas"
 * Expected Output:
 * {
 *   responseText: "Perfecto — el tratamiento despigmentante cuesta $30 y dura 90 min. ¿Qué prefiere?",
 *   options: [
 *     { id: '1', label: 'Agendar tratamiento específico', action: 'book_treatment', payload: { treatmentId: 't_123' } },
 *     { id: '2', label: 'Más información', action: 'more_info', payload: { treatmentId: 't_123' } },
 *     { id: '3', label: 'Hablar con Dra. Daniela', action: 'transfer_doctor', payload: { ... } }
 *   ],
 *   lastQuestionId: "q_abc123",
 *   expiresAt: "2025-12-01T12:00:00Z",
 *   metadata: { treatmentId: 't_123', price: 30, consultationIncluded: true }
 * }
 * 
 * CASO B: Usuario responde con opción numérica
 * Input (después de CASO A): "1" o "opción 1" o "la 1" o "uno"
 * Expected: parseOptionReply detecta option 1 → action 'book_treatment'
 * → stateMachine.start(phone, { treatmentId: 't_123', treatmentPrice: 30 })
 * 
 * CASO C: Usuario fuera de contexto al responder opciones
 * Input (después de CASO A): "mañana" (cuando se esperaba 1, 2 o 3)
 * Expected: clarifyInContext() → "Disculpe, ¿se refiere a agendar (1), más info (2) o hablar con Dra. (3)?"
 * 
 * CASO D: Regla de precios en agendamiento
 * Escenario 1: Usuario agenda tratamiento antimanchas
 * Expected: appointment.price = $30, priceNote = "Tratamiento antimanchas (consulta incluida)"
 * 
 * Escenario 2: Usuario agenda solo consulta
 * Expected: appointment.price = $11.50, priceNote = "Consulta ($11.50 IVA incluido)"
 * 
 * CASO E: Problema estético con needsConsultation
 * Input: "Tengo manchas en la cara"
 * Expected Output:
 * {
 *   responseText: "Buenos días, soy Salomé de BIOSKIN 😊 Entiendo su preocupación...",
 *   suggestedActions: ['offer_consultation', 'show_treatments', 'transfer_doctor'],
 *   meta: { classification: 'skin_concern', problem: 'pigmentation', needsConsultation: true }
 * }
 */

import OpenAI from 'openai';
import { 
  getAllTreatments,
  findServiceByKeyword,
  generateCatalogText,
  getTreatmentsByCategory
} from './services-adapter.js';

/**
 * Obtiene el saludo apropiado según la hora de Ecuador
 */
function getTimeBasedGreeting() {
  const ecuadorDate = new Date(new Date().toLocaleString('en-US', { 
    timeZone: 'America/Guayaquil'
  }));
  const hour = ecuadorDate.getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'Buenos días';
  } else if (hour >= 12 && hour < 19) {
    return 'Buenas tardes';
  } else {
    return 'Buenas noches';
  }
}

/**
 * Cliente OpenAI (compartido)
 */
let openai = null;

function getOpenAIClient() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY no configurada');
    }
    
    openai = new OpenAI({
      apiKey: apiKey,
      timeout: 10000,
      maxRetries: 1
    });
    
    console.log('✅ [MedicalAI] Cliente OpenAI inicializado');
  }
  return openai;
}

/**
 * Clasificador basado en IA con few-shot learning para consultas MÉDICO-ESTÉTICAS
 * Determina si el mensaje es médico-estético y de qué tipo
 * 
 * @param {string} message - Mensaje del usuario
 * @param {Array} conversationHistory - Historial para contexto
 * @returns {Promise<Object>} { kind, subtype, question, entities, confidence }
 */
export async function classifyMedical(message, conversationHistory = []) {
  console.log(`🔍 [MedicalAI] Clasificando mensaje: "${message.substring(0, 60)}..."`);
  
  try {
    const client = getOpenAIClient();
    
    // Construir contexto de historial
    let contextText = '';
    if (conversationHistory.length > 0) {
      const recent = conversationHistory.slice(-4);
      contextText = recent.map(m => `${m.role}: ${m.content}`).join('\n');
    }

    // Prompt con few-shot examples para MEDICINA ESTÉTICA
    const classificationPrompt = `Eres un clasificador médico-estético para BIOSKIN. Analiza si el mensaje es una consulta MÉDICO-ESTÉTICA sobre tratamientos, procedimientos o problemas de piel.

CONTEXTO DE CONVERSACIÓN PREVIA:
${contextText || 'Sin historial previo'}

MENSAJE ACTUAL DEL USUARIO:
"${message}"

EJEMPLOS DE CLASIFICACIÓN (few-shot):

User: "Tengo manchas en la cara, ¿qué tratamiento me recomiendan?"
→ kind: medical, subtype: skin_concern, problem: pigmentation, confidence: 0.95, needsConsultation: true

User: "Quiero saber el precio del botox"
→ kind: medical, subtype: price_inquiry, treatment: botox, confidence: 0.90, needsConsultation: false

User: "¿Cuánto cuesta una limpieza facial?"
→ kind: medical, subtype: price_inquiry, treatment: facial_cleaning, confidence: 0.92, needsConsultation: false

User: "Tengo arrugas en la frente, qué puedo hacer"
→ kind: medical, subtype: skin_concern, problem: wrinkles, confidence: 0.93, needsConsultation: true

User: "Me gustaría hacerme rellenos de labios"
→ kind: medical, subtype: treatment_interest, treatment: lip_fillers, confidence: 0.90, needsConsultation: true

User: "Sufro de acné severo desde hace años"
→ kind: medical, subtype: skin_concern, problem: acne, confidence: 0.95, needsConsultation: true

User: "¿Qué tratamiento es mejor para flacidez facial?"
→ kind: medical, subtype: treatment_recommendation, problem: sagging, confidence: 0.88, needsConsultation: true

User: "Quiero agendar una consulta de evaluación"
→ kind: medical, subtype: appointment_request, service: consultation, confidence: 0.98, needsConsultation: false

User: "¿El láser CO2 sirve para cicatrices?"
→ kind: medical, subtype: treatment_inquiry, treatment: co2_laser, problem: scars, confidence: 0.90, needsConsultation: true

User: "Cuánto dura el efecto del ácido hialurónico"
→ kind: medical, subtype: treatment_inquiry, treatment: hyaluronic_acid, confidence: 0.87, needsConsultation: false

User: "¿Tienen promociones en tratamientos faciales?"
→ kind: medical, subtype: promotion_inquiry, category: facial, confidence: 0.85, needsConsultation: false

User: "Tengo la piel muy grasa y con poros abiertos"
→ kind: medical, subtype: skin_concern, problem: oily_skin_pores, confidence: 0.92, needsConsultation: true

User: "Mi equipo HIFU no funciona"
→ kind: technical, subtype: support, question: equipment_failure, confidence: 0.95, needsConsultation: false

INSTRUCCIONES CRÍTICAS:
1. Si el usuario menciona un PROBLEMA ESTÉTICO (manchas, arrugas, acné, flacidez, etc.):
   → kind: medical, subtype: skin_concern, needsConsultation: true
   
2. Si pregunta por PRECIO o COSTO de tratamiento:
   → kind: medical, subtype: price_inquiry, needsConsultation: false

3. Si muestra INTERÉS en un tratamiento específico:
   → kind: medical, subtype: treatment_interest, needsConsultation: true

4. Si pide RECOMENDACIÓN para su caso:
   → kind: medical, subtype: treatment_recommendation, needsConsultation: true

5. Si pregunta sobre CARACTERÍSTICAS de tratamiento:
   → kind: medical, subtype: treatment_inquiry, needsConsultation: false

6. Si es sobre EQUIPOS médicos (compra, falla, reparación):
   → kind: technical (NO es médico-estético)

7. Clasifica el subtipo:
   - skin_concern: problemas/preocupaciones estéticas
   - treatment_interest: quiere hacerse un tratamiento
   - treatment_recommendation: pide recomendación
   - treatment_inquiry: pregunta sobre tratamiento
   - price_inquiry: pregunta por precios
   - promotion_inquiry: pregunta por promociones
   - appointment_request: quiere agendar cita

8. Identifica el problema o tratamiento mencionado
9. Asigna confidence (0.0-1.0)
10. needsConsultation: true si necesita evaluación médica personalizada

RESPONDE EN FORMATO JSON PURO (sin markdown):
{
  "kind": "medical|technical|general",
  "subtype": "skin_concern|treatment_interest|treatment_recommendation|treatment_inquiry|price_inquiry|promotion_inquiry|appointment_request|other",
  "problem": "pigmentation|wrinkles|acne|sagging|scars|oily_skin|dark_circles|cellulite|stretch_marks|other",
  "treatment": "botox|fillers|laser|facial|peeling|microneedling|prp|bioestimulators|other",
  "category": "facial|corporal|injectable|laser|regenerative|evaluation|other",
  "needsConsultation": true|false,
  "entities": {
    "concerns": ["concern1", "concern2"],
    "treatments": ["treatment1", "treatment2"],
    "bodyAreas": ["area1", "area2"],
    "keywords": []
  },
  "confidence": 0.85,
  "reasoning": "breve explicación de 1 línea"
}`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Eres un clasificador JSON médico-estético. Responde SOLO JSON válido, sin markdown ni explicaciones adicionales.' },
        { role: 'user', content: classificationPrompt }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const responseText = completion.choices[0].message.content.trim();
    console.log(`📊 [MedicalAI] Respuesta raw de clasificación: ${responseText.substring(0, 100)}...`);
    
    // Limpiar markdown si existe
    const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const classification = JSON.parse(jsonText);

    console.log(`✅ [MedicalAI] Clasificación: ${classification.kind}/${classification.subtype} (confidence: ${classification.confidence})`);
    
    return classification;

  } catch (error) {
    console.error(`❌ [MedicalAI] Error en clasificación IA:`, error.message);
    
    // Fallback heurístico si IA falla
    return classifyMedicalFallback(message);
  }
}

/**
 * Clasificación heurística de respaldo (basada en keywords)
 */
function classifyMedicalFallback(message) {
  console.log(`🔄 [MedicalAI] Usando clasificador fallback heurístico`);
  
  const lowerMsg = message.toLowerCase();
  
  // Detectar si es médico-estético
  const medicalKeywords = /(mancha|arruga|acné|acne|botox|relleno|laser|láser|limpieza|facial|piel|rostro|cara|tratamiento|procedimiento)/i;
  const isMedical = medicalKeywords.test(lowerMsg);
  
  if (!isMedical) {
    return {
      kind: 'general',
      subtype: 'other',
      problem: null,
      treatment: null,
      category: null,
      needsConsultation: false,
      entities: { concerns: [], treatments: [], bodyAreas: [], keywords: [] },
      confidence: 0.50,
      reasoning: 'Clasificación fallback - no detectó palabras médico-estéticas'
    };
  }

  // Determinar subtipo
  let subtype = 'other';
  let problem = null;
  let treatment = null;
  let needsConsultation = false;

  // Detectar problema estético
  if (/(tengo|sufro|me salen|me aparecen).*mancha/i.test(lowerMsg)) {
    subtype = 'skin_concern';
    problem = 'pigmentation';
    needsConsultation = true;
  } else if (/(tengo|sufro|me salen).*arruga/i.test(lowerMsg)) {
    subtype = 'skin_concern';
    problem = 'wrinkles';
    needsConsultation = true;
  } else if (/(tengo|sufro de).*acn[eé]/i.test(lowerMsg)) {
    subtype = 'skin_concern';
    problem = 'acne';
    needsConsultation = true;
  } else if (/(precio|costo|cuánto|cuanto|valor)/i.test(lowerMsg)) {
    subtype = 'price_inquiry';
    needsConsultation = false;
  } else if (/(quiero|me gustaría|deseo).*hacerme/i.test(lowerMsg)) {
    subtype = 'treatment_interest';
    needsConsultation = true;
  } else if (/(qué.*recomienda|recomienda.*para|qué.*mejor)/i.test(lowerMsg)) {
    subtype = 'treatment_recommendation';
    needsConsultation = true;
  } else if (/(agendar|cita|reservar|consulta)/i.test(lowerMsg)) {
    subtype = 'appointment_request';
    needsConsultation = false;
  }

  // Detectar tratamientos mencionados
  const treatments = [];
  if (/botox/i.test(lowerMsg)) treatments.push('botox');
  if (/relleno/i.test(lowerMsg)) treatments.push('fillers');
  if (/laser|láser/i.test(lowerMsg)) treatments.push('laser');
  if (/limpieza.*facial/i.test(lowerMsg)) treatments.push('facial_cleaning');

  return {
    kind: 'medical',
    subtype,
    problem,
    treatment: treatments[0] || null,
    category: 'facial',
    needsConsultation,
    entities: { concerns: [], treatments, bodyAreas: [], keywords: [] },
    confidence: 0.65,
    reasoning: 'Clasificación fallback heurística'
  };
}

/**
 * Genera un ID único corto para las preguntas del bot
 */
function generateQuestionId() {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Genera respuesta médico-estética usando IA con contexto de tratamientos REALES
 * NUEVO: Retorna estructura con options[], lastQuestionId, expiresAt, metadata
 * 
 * @param {Object} classification - Resultado de classifyMedical
 * @param {Array} conversationHistory - Historial de conversación
 * @param {Object} tools - Herramientas opcionales (no usado actualmente)
 * @returns {Promise<Object>} { responseText, options, lastQuestionId, expiresAt, metadata, suggestedActions, meta }
 */
export async function generateMedicalReply(classification, conversationHistory = [], tools = null) {
  console.log(`🤖 [MedicalAI] Generando respuesta para ${classification.subtype}`);
  console.log(`🔍 [MedicalAI] needsConsultation: ${classification.needsConsultation}`);
  
  try {
    const lastUserMsg = conversationHistory.filter(m => m.role === 'user').pop()?.content || '';
    const client = getOpenAIClient();
    const greeting = getTimeBasedGreeting();
    
    // PASO 1: Si el usuario tiene problema estético específico (needsConsultation: true)
    if (classification.needsConsultation === true && classification.subtype === 'skin_concern') {
      console.log('🏥 [MedicalAI] Generando respuesta para PROBLEMA ESTÉTICO con IA');
      
      // Construir historial para contexto
      const recentHistory = conversationHistory.slice(-6);
      const messages = [
        { 
          role: 'system', 
          content: `Eres Salomé, asistente médico-estética de BIOSKIN especializada en tratamientos faciales y corporales.

CONTEXTO IMPORTANTE:
- El usuario tiene una preocupación estética específica: ${classification.problem || 'problema de piel'}
- BIOSKIN ofrece consultas de evaluación ($10, 30 min) con la Dra. Daniela Creamer
- También ofrecen tratamientos especializados según el diagnóstico

TU TAREA:
1. Saluda con: "${greeting}, soy Salomé de BIOSKIN 😊"
2. Muestra empatía por la preocupación estética que mencionó
3. Explica BREVEMENTE (2 líneas) que BIOSKIN tiene tratamientos para ese problema
4. Menciona que el primer paso es una evaluación personalizada con la Dra. Daniela
5. Ofrece 3 opciones:
   - Agendar consulta de evaluación ($10, 30 min)
   - Más información sobre tratamientos disponibles
   - Contacto directo con la Dra. Daniela por WhatsApp

TONO: Profesional, empático, cercano
LONGITUD: Máximo 5-6 líneas
NO uses listas con bullets, habla de forma natural y fluida.
NO diagnostiques ni prometas resultados, solo orienta.
NO menciones tratamientos específicos sin evaluación previa.`
        }
      ];
      
      recentHistory.forEach(msg => {
        messages.push({ role: msg.role, content: msg.content });
      });
      
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 220
      });
      
      const responseText = completion.choices[0].message.content;
      
      return {
        responseText,
        suggestedActions: ['offer_consultation', 'show_treatments', 'transfer_doctor'],
        meta: {
          classification: classification.subtype,
          problem: classification.problem,
          needsConsultation: true,
          aiGenerated: true,
          tokensUsed: completion.usage?.total_tokens || 0
        }
      };
    }
    
    // PASO 2: Si pregunta por PRECIO de tratamiento específico
    if (classification.subtype === 'price_inquiry') {
      console.log('💰 [MedicalAI] Consulta de precio detectada');
      
      // Buscar tratamiento en catálogo
      const treatment = findServiceByKeyword(lastUserMsg);
      
      if (treatment) {
        console.log(`✅ [MedicalAI] Tratamiento encontrado: ${treatment.title}`);
        
        let responseText = `${greeting} 😊\n\n`;
        responseText += `El tratamiento de *${treatment.title}* tiene:\n`;
        responseText += `💰 Precio: ${treatment.price}\n`;
        responseText += `⏱️ Duración: ${treatment.duration}\n\n`;
        responseText += `¿Desea más información sobre este tratamiento o prefiere agendar una consulta de evaluación?`;
        
        return {
          responseText,
          suggestedActions: ['provide_details', 'offer_consultation'],
          meta: {
            classification: classification.subtype,
            treatmentFound: treatment.id,
            priceProvided: true,
            confidence: classification.confidence
          }
        };
      } else {
        // No se encontró tratamiento específico, mostrar catálogo
        const catalogText = generateCatalogText();
        
        let responseText = `${greeting} 😊\n\n`;
        responseText += `Le comparto nuestro catálogo de tratamientos:\n\n`;
        responseText += catalogText;
        responseText += `\n¿Sobre cuál tratamiento desea información más detallada?`;
        
        return {
          responseText,
          suggestedActions: ['show_catalog'],
          meta: {
            classification: classification.subtype,
            catalogShown: true,
            confidence: classification.confidence
          }
        };
      }
    }
    
    // PASO 3: Si muestra INTERÉS en tratamiento específico (IA-FIRST con opciones)
    if (classification.subtype === 'treatment_interest') {
      console.log('💉 [MedicalAI] Usuario muestra interés en tratamiento');
      
      const treatment = findServiceByKeyword(lastUserMsg);
      
      if (treatment) {
        const questionId = generateQuestionId();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutos
        
        // Extraer precio numérico del tratamiento
        const priceMatch = treatment.price.match(/\d+/);
        const treatmentPrice = priceMatch ? parseFloat(priceMatch[0]) : null;
        
        let responseText = `${greeting} 😊\n\n`;
        responseText += `¡Excelente elección! El tratamiento de *${treatment.title}* es muy efectivo.\n\n`;
        responseText += `💰 Inversión: ${treatment.price}\n`;
        responseText += `⏱️ Duración: ${treatment.duration}\n\n`;
        responseText += `📋 *Opciones disponibles:*\n`;
        responseText += `1️⃣ Agendar tratamiento específico\n`;
        responseText += `2️⃣ Más información sobre el tratamiento\n`;
        responseText += `3️⃣ Hablar con la Dra. Daniela\n\n`;
        responseText += `¿Qué prefiere? (responda con el número)`;
        
        return {
          responseText,
          options: [
            {
              id: '1',
              label: 'Agendar tratamiento específico',
              action: 'book_treatment',
              payload: { treatmentId: treatment.id, treatmentName: treatment.title, treatmentPrice }
            },
            {
              id: '2',
              label: 'Más información',
              action: 'more_info',
              payload: { treatmentId: treatment.id }
            },
            {
              id: '3',
              label: 'Hablar con Dra. Daniela',
              action: 'transfer_doctor',
              payload: { reason: 'treatment_interest', treatmentId: treatment.id }
            }
          ],
          lastQuestionId: questionId,
          expiresAt,
          metadata: {
            treatmentId: treatment.id,
            treatmentName: treatment.title,
            price: treatmentPrice,
            duration: treatment.duration,
            consultationIncluded: true // Si agenda tratamiento, consulta está incluida
          },
          suggestedActions: ['offer_consultation', 'provide_details', 'transfer_doctor'],
          meta: {
            classification: classification.subtype,
            treatmentFound: treatment.id,
            interestDetected: true,
            aiGenerated: false
          }
        };
      }
    }
    
    // PASO 4: Si pide RECOMENDACIÓN para su caso
    if (classification.subtype === 'treatment_recommendation') {
      console.log('🎯 [MedicalAI] Usuario pide recomendación personalizada');
      
      const messages = [
        { 
          role: 'system', 
          content: `Eres Salomé, asistente médico-estética de BIOSKIN.

El usuario pide recomendación de tratamiento. NO diagnostiques ni recomiendes tratamientos específicos.

TU RESPUESTA:
1. Saluda: "${greeting}, soy Salomé de BIOSKIN 😊"
2. Explica que para una recomendación precisa necesita evaluación personalizada
3. Menciona que la Dra. Daniela puede evaluar su caso específicamente
4. Ofrece consulta de evaluación ($10, 30 min)
5. Pregunta si prefiere agendar consulta o hablar con la Dra. directamente

TONO: Profesional, empático
LONGITUD: 4-5 líneas
NO des recomendaciones sin evaluación médica.`
        },
        { role: 'user', content: lastUserMsg }
      ];
      
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 200
      });
      
      return {
        responseText: completion.choices[0].message.content,
        suggestedActions: ['offer_consultation', 'transfer_doctor'],
        meta: {
          classification: 'treatment_recommendation',
          needsPersonalizedEvaluation: true,
          aiGenerated: true,
          tokensUsed: completion.usage?.total_tokens || 0
        }
      };
    }
    
    // PASO 5: Consulta general médico-estética con IA
    console.log('🤖 [MedicalAI] Generando respuesta general con IA...');
    
    // Obtener catálogo de tratamientos como contexto
    const availableTreatments = getAllTreatments();
    let contextForAI = `TRATAMIENTOS DISPONIBLES EN BIOSKIN:\n\n`;
    
    availableTreatments.slice(0, 15).forEach((service, idx) => {
      contextForAI += `${idx + 1}. ${service.title}\n`;
      contextForAI += `   Precio: ${service.price} | Duración: ${service.duration}\n`;
      contextForAI += `   Categoría: ${service.category}\n\n`;
    });
    
    // System prompt optimizado
    const medicalSystemPrompt = `Eres Salomé, asistente médico-estética de BIOSKIN especializada en tratamientos faciales y corporales.

${contextForAI}

TU ROL:
- Nombre: Salomé de BIOSKIN
- Trato: Formal y profesional (use "usted")
- Especialidad: Medicina estética, tratamientos faciales y corporales

INSTRUCCIONES:
1. Responde de forma BREVE (2-4 líneas máximo)
2. USA la información de tratamientos REALES proporcionada arriba
3. NO diagnostiques ni recomiendes sin evaluación médica
4. Termina con pregunta abierta u oferta de consulta
5. Usa 1-2 emojis profesionales (✨💆🏥💉)

IMPORTANTE:
- NO inventes información de tratamientos
- NO des diagnósticos médicos
- Sé empático y profesional`;

    // Construir mensajes para OpenAI
    const messages = [
      { role: 'system', content: medicalSystemPrompt }
    ];

    // Agregar historial reciente
    const recentHistory = conversationHistory.slice(-6);
    recentHistory.forEach(msg => {
      messages.push({ role: msg.role, content: msg.content });
    });

    // Llamar a OpenAI
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 200
    });

    const responseText = completion.choices[0].message.content;

    console.log(`✅ [MedicalAI] Respuesta generada: ${responseText.substring(0, 80)}...`);

    // Determinar acciones sugeridas
    const suggestedActions = [];
    if (responseText.toLowerCase().includes('consulta') || responseText.toLowerCase().includes('evaluación')) {
      suggestedActions.push('offer_consultation');
    } else {
      suggestedActions.push('continue_conversation');
    }

    return {
      responseText,
      suggestedActions,
      meta: {
        classification: classification.subtype,
        confidence: classification.confidence,
        treatmentsAvailable: availableTreatments.length,
        tokensUsed: completion.usage?.total_tokens || 0
      }
    };

  } catch (error) {
    console.error(`❌ [MedicalAI] Error generando respuesta:`, error.message);
    
    // Fallback básico
    return {
      responseText: `${getTimeBasedGreeting()}, soy Salomé de BIOSKIN 😊\n\nDisculpe, tengo un problema técnico temporal. Por favor, contacte directamente a la Dra. Daniela Creamer al +593969890689 para asistencia médico-estética inmediata. 🏥`,
      suggestedActions: ['transfer_doctor'],
      meta: {
        error: error.message,
        fallback: true
      }
    };
  }
}

/**
 * Genera resumen para transferencia a la doctora
 */
export function generateDoctorTransferSummary(conversationHistory, classification, meta) {
  const recentMessages = conversationHistory.slice(-6);
  
  let summary = `📋 *RESUMEN MÉDICO-ESTÉTICO - Transferencia a Dra. Daniela*\n\n`;
  summary += `💆 *Tipo de consulta:* ${classification.subtype}\n`;
  
  if (classification.problem) {
    summary += `🎯 *Problema identificado:* ${classification.problem}\n`;
  }
  
  if (classification.treatment) {
    summary += `💉 *Tratamiento de interés:* ${classification.treatment}\n`;
  }
  
  summary += `📊 *Confianza:* ${(classification.confidence * 100).toFixed(0)}%\n\n`;
  
  summary += `💬 *Últimos mensajes:*\n`;
  recentMessages.filter(m => m.role === 'user').forEach((msg, idx) => {
    const preview = msg.content.length > 80 ? msg.content.substring(0, 80) + '...' : msg.content;
    summary += `${idx + 1}. "${preview}"\n`;
  });
  
  summary += `\n🏥 *Requiere:* Evaluación médica personalizada`;
  
  return summary;
}

/**
 * Genera enlace de WhatsApp para doctora
 */
export function generateDoctorWhatsAppLink(summary, patientPhone = '') {
  const DOCTOR_PHONE = '593969890689'; // Dra. Daniela Creamer
  
  let message = `Hola Dra. Daniela, me contacto desde el chatbot de BIOSKIN.\n\n`;
  
  if (patientPhone) {
    message += `📱 Mi número: ${patientPhone}\n\n`;
  }
  
  message += summary;
  message += `\n\n_Mensaje enviado desde chatbot BIOSKIN_`;
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${DOCTOR_PHONE}?text=${encodedMessage}`;
}
