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
  getAllServices,
  getAllTreatments,
  findServiceByKeyword,
  generateCatalogText
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
    
    // Detectar si es primer contacto (no hay mensajes del asistente previos)
    const hasAssistantMessages = conversationHistory.some(m => m.role === 'assistant');
    const isFirstContact = !hasAssistantMessages;
    const greeting = isFirstContact 
      ? getTimeBasedGreeting() + ', soy Salomé de BIOSKIN' 
      : getTimeBasedGreeting();
    
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
1. Saluda con: "${greeting} 😊" (YA incluye presentación si es necesario)
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
      
      // CASO ESPECIAL: Si pregunta específicamente por consulta
      if (/(consulta|evaluaci[oó]n|cita con.*doctor|cita con.*dra)/i.test(lastUserMsg)) {
        console.log('✅ [MedicalAI] Pregunta por CONSULTA específicamente');
        
        let responseText = `${greeting} 😊\n\n`;
        responseText += `La *Consulta Médica Estética* tiene un costo de *$10* y dura *30 minutos*.\n\n`;
        responseText += `Incluye:\n`;
        responseText += `• Diagnóstico profesional de su piel\n`;
        responseText += `• Plan de tratamiento personalizado\n`;
        responseText += `• Recomendaciones de la Dra. Daniela Creamer\n\n`;
        responseText += `¿Desea agendar su consulta?`;
        
        return {
          responseText,
          suggestedActions: ['book_consultation'],
          meta: {
            classification: 'price_inquiry',
            service: 'consultation',
            priceProvided: true,
            confidence: classification.confidence
          }
        };
      }
      
      // Buscar tratamiento en catálogo
      const treatment = findServiceByKeyword(lastUserMsg);
      
      if (treatment) {
        console.log(`✅ [MedicalAI] Tratamiento encontrado: ${treatment.title}`);
        
        let responseText = `${greeting} 😊\n\n`;
        
        // 🎁 Verificar si tiene promoción activa
        if (treatment.promotion && treatment.promotion.active) {
          const promo = treatment.promotion;
          const now = new Date();
          const validFrom = new Date(promo.validFrom);
          const validUntil = new Date(promo.validUntil);
          
          if (now >= validFrom && now <= validUntil) {
            responseText += `🎉 *${treatment.title}*\n\n`;
            responseText += `${promo.displayMessage}\n`;
            responseText += `⏰ Válida hasta: ${validUntil.toLocaleDateString('es-EC')}\n\n`;
            responseText += `💰 Precio promocional: ${promo.promoPrice}\n`;
            responseText += `💵 Precio regular: ${treatment.price}\n`;
            responseText += `⏱️ Duración: ${treatment.duration}\n\n`;
            responseText += `¿Desea más información sobre este tratamiento o prefiere agendar una consulta de evaluación?`;
            
            return {
              responseText,
              suggestedActions: ['provide_details', 'offer_consultation'],
              meta: {
                classification: classification.subtype,
                treatmentFound: treatment.id,
                priceProvided: true,
                promotionActive: true,
                confidence: classification.confidence
              }
            };
          }
        }
        
        // Sin promoción o promoción expirada
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
        // No se encontró tratamiento específico, mostrar catálogo SIN precios
        const isFirstContact = conversationHistory.length === 0;
        const greeting = isFirstContact ? getTimeBasedGreeting() + ', soy Salomé de BIOSKIN' : getTimeBasedGreeting();
        
        let responseText = isFirstContact ? `${greeting} 😊\n\n` : '';
        responseText += `Contamos con tratamientos faciales (limpiezas, antiaging, antimanchas), `;
        responseText += `tratamientos láser (IPL, CO2, Hollywood Peel), `;
        responseText += `tratamientos corporales (HIFU, lipopapada) y `;
        responseText += `tratamientos avanzados (exosomas, bioestimuladores).\n\n`;
        responseText += `ℹ️ *Nota:* Todos los tratamientos incluyen diagnóstico facial y evaluación previa.\n\n`;
        responseText += `¿Cuál le interesa conocer a detalle?`;
        
        return {
          responseText,
          suggestedActions: ['show_catalog'],
          meta: {
            classification: classification.subtype,
            catalogShown: true,
            withoutPrices: true,
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
    
    // Obtener catálogo completo de servicios para contexto de IA
    const availableServices = getAllServices();
    
    // Construir catálogo detallado para contexto de IA (incluyendo promociones)
    let servicesContext = 'CATÁLOGO COMPLETO DE SERVICIOS BIOSKIN:\n\n';
    let activePromotions = [];
    
    availableServices.forEach((service, index) => {
      servicesContext += `${index + 1}. ${service.title}\n`;
      servicesContext += `   Precio: ${service.price}\n`;
      servicesContext += `   Duración: ${service.duration}\n`;
      servicesContext += `   Descripción: ${service.shortDescription}\n`;
      if (service.benefits && service.benefits.length > 0) {
        servicesContext += `   Beneficios: ${service.benefits.slice(0, 2).join(', ')}\n`;
      }
      
      // 🎁 AGREGAR INFORMACIÓN DE PROMOCIÓN SI ESTÁ ACTIVA
      if (service.promotion && service.promotion.active) {
        const promo = service.promotion;
        // Verificar si la promoción está vigente
        const now = new Date();
        const validFrom = new Date(promo.validFrom);
        const validUntil = new Date(promo.validUntil);
        
        if (now >= validFrom && now <= validUntil) {
          servicesContext += `   🎁 PROMOCIÓN ACTIVA: ${promo.name}\n`;
          servicesContext += `   💰 Precio promocional: ${promo.promoPrice}\n`;
          servicesContext += `   ⏰ Válida hasta: ${promo.validUntil}\n`;
          servicesContext += `   📋 ${promo.displayMessage}\n`;
          activePromotions.push({
            service: service.title,
            message: promo.displayMessage,
            promoPrice: promo.promoPrice
          });
        }
      }
      
      servicesContext += '\n';
    });
    
    // Agregar sección de promociones activas al inicio si existen
    if (activePromotions.length > 0) {
      let promotionsHeader = '🎉 PROMOCIONES ACTIVAS:\n\n';
      activePromotions.forEach(promo => {
        promotionsHeader += `${promo.message}\n`;
      });
      promotionsHeader += '\n---\n\n';
      servicesContext = promotionsHeader + servicesContext;
    }
    
    // System prompt con contexto completo e instrucciones inteligentes
    const medicalSystemPrompt = `Eres Salomé, asistente médico-estética de BIOSKIN especializada en tratamientos faciales y corporales.

${servicesContext}

TU ROL:
- Nombre: Salomé de BIOSKIN
- Trato: Formal y profesional (use "usted")
- Especialidad: Medicina estética, tratamientos faciales y corporales

INSTRUCCIONES INTELIGENTES DE RESPUESTA:

📋 **Si preguntan QUÉ SERVICIOS/TRATAMIENTOS tienen (consulta general):**
   → Responde con SOLO una lista de nombres (sin precios, sin descripciones)
   → Formato: "Contamos con:\n• [Nombre]\n• [Nombre]\n..."
   → Termina con: "¿Cuál le interesa conocer en detalle?"
   → NO incluyas precios ni duraciones en esta respuesta
   → Ejemplo correcto:
     "Contamos con:
     • Consulta Médica Estética
     • Limpieza Facial Profunda
     • Hollywood Peel
     • HIFU 7D
     ...
     ¿Cuál le interesa conocer en detalle?"

💰 **Si preguntan por PRECIO o DETALLES de UN tratamiento específico:**
   → 🚨 PRIMERO verifica si tiene PROMOCIÓN ACTIVA en el catálogo
   → Si tiene promoción: Menciona PRIMERO el precio promocional con el mensaje de promoción
   → Si NO tiene promoción: Menciona el precio regular
   → Da información COMPLETA: nombre, descripción, precio, duración
   → Menciona 2-3 beneficios clave
   → Termina ofreciendo agendar: "¿Le gustaría agendar una cita?"
   → Ejemplo CON promoción:
     "✨ *Hollywood Peel*
     
     ⭐ BLACK WEEK: 1x$35 o 2x$55 ¡Ahorra $15!
     (Válida hasta 01/12/2025)
     
     Láser de carbón activado que elimina impurezas...
     
     💵 Precio promocional: $35 (1 sesión) o $55 (2 sesiones)
     💵 Precio regular: $30
     ⏱️ Duración: 90 minutos
     
     Beneficios:
     • Luminosidad instantánea
     • Reduce poros
     
     ¿Le gustaría agendar?"
   
   → Ejemplo SIN promoción:
     "✨ *Limpieza Facial Profunda*
     
     Limpieza profunda con extracción...
     
     💵 Precio: $25
     ⏱️ Duración: 90 minutos
     
     Beneficios:
     • Eliminación de impurezas
     • Piel más luminosa
     
     ¿Le gustaría agendar?"

ℹ️ **Si preguntan por MÁS INFORMACIÓN de un tratamiento:**
   → Proporciona detalles adicionales: indicaciones, proceso, resultados esperados
   → Usa la información del catálogo
   → Mantén tono profesional y educativo

🚫 **Si preguntan por tratamiento que NO EXISTE en el catálogo:**
   → Responde honestamente que NO ofrecemos ese tratamiento
   → Sugiere 1-2 tratamientos SIMILARES que SÍ tenemos
   → Ejemplo correcto:
     "No ofrecemos [tratamiento X] en este momento. Sin embargo, tenemos:
     • [Tratamiento similar 1]: [breve descripción]
     • [Tratamiento similar 2]: [breve descripción]
     
     ¿Le interesa conocer más sobre alguno de estos?"

📅 **Si mencionan AGENDAR o RESERVAR:**
   → Menciona que puedes ayudarles a agendar
   → Pregunta si desean continuar con el proceso
   → Ejemplo: "¡Claro! Puedo ayudarle a agendar. ¿Desea que le guíe paso a paso?"

REGLAS GENERALES:
- Responde de forma BREVE (máximo 8 líneas)
- NO diagnostiques ni recomiendes tratamientos específicos sin evaluación
- SIEMPRE menciona: "Todos los tratamientos incluyen diagnóstico facial y evaluación previa"
- Usa emojis profesionales con moderación (✨💆🏥💉💵⏱️)
- Si tienes duda del tipo de consulta, pregunta para clarificar
- NO inventes tratamientos o precios que no estén en el catálogo
`;

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
      max_tokens: 350
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
        aiGenerated: true,
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
