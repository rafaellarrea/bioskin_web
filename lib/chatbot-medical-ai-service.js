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
 * Mapeo de jerga popular a tratamientos canónicos
 * @param {string} text - Texto del usuario
 * @returns {string[]} Array de tratamientos canónicos identificados
 */
function mapJargonToTreatments(text) {
  const normalized = text.toLowerCase();
  const mappings = {
    'bioestimulador': ['Radiesse', 'Sculptra', 'HIFU'],
    'bioestimuladores': ['Radiesse', 'Sculptra', 'HIFU'],
    'vampiro': ['Plasma Rico en Plaquetas'],
    'prp': ['Plasma Rico en Plaquetas'],
    'hilos': ['Hilos Tensores'],
    'hilos magicos': ['Hilos Tensores'],
    'baby botox': ['Toxina Botulínica (Preventiva)'],
    'botox': ['Toxina Botulínica'],
    'dysport': ['Toxina Botulínica'],
    'xeomin': ['Toxina Botulínica'],
    'relleno': ['Ácido Hialurónico'],
    'fillers': ['Ácido Hialurónico'],
    'labios rusos': ['Relleno de Labios (Técnica Rusa)'],
    'perfilado': ['Relleno de Labios', 'Relleno de Mandíbula'],
    'rinomodelacion': ['Rinomodelación con Ácido Hialurónico'],
    'peeling quimico': ['Peeling Médico'],
    'limpieza profunda': ['Hydrafacial', 'Limpieza Facial Profunda'],
    'hollywood peel': ['Láser Carbon Peel'],
    'laser co2': ['Láser CO2 Fraccionado'],
    'depilacion': ['Depilación Láser'],
    'masajes': ['Drenaje Linfático', 'Masaje Reductor'],
    'quemar grasa': ['Enzimas Lipolíticas', 'Criolipólisis', 'Mela'],
    'lipo sin cirugia': ['Mela', 'Criolipólisis', 'Enzimas'],
    'sueros': ['Sueroterapia'],
    'vitaminas': ['Sueroterapia', 'Mesoterapia']
  };

  let foundTreatments = new Set();
  
  for (const [jargon, treatments] of Object.entries(mappings)) {
    if (normalized.includes(jargon)) {
      treatments.forEach(t => foundTreatments.add(t));
    }
  }

  return Array.from(foundTreatments);
}

/**
 * Detecta nivel de triage basado en señales de alarma
 * @param {string} text - Texto del usuario
 * @returns {Object} { level: 'low'|'medium'|'high', reason: string, mustEscalate: boolean }
 */
function detectTriageLevel(text) {
  const normalized = text.toLowerCase();
  
  // Señales de ALARMA (High Priority)
  const highRiskSignals = [
    'sangrado', 'sangre', 'hemorragia', 'pus', 'infeccion', 'infectado', 
    'fiebre', 'dolor insoportable', 'dolor muy fuerte', 'no puedo respirar',
    'hinchazon extrema', 'deformidad', 'necrosis', 'piel negra', 'piel morada',
    'quemadura grave', 'ampollas', 'reaccion alergica', 'anafilaxia',
    'desmayo', 'mareo fuerte', 'palpitaciones'
  ];

  // Señales de ATENCIÓN (Medium Priority)
  const mediumRiskSignals = [
    'dolor', 'molestia', 'ardor', 'picazon', 'rojez', 'inflamacion',
    'moreton', 'hematoma', 'bulto', 'bolita', 'asimetria',
    'no me gusta', 'resultado raro', 'duda post tratamiento'
  ];

  // Detección High
  for (const signal of highRiskSignals) {
    if (normalized.includes(signal)) {
      return {
        level: 'high',
        reason: `Detectada señal de alarma: ${signal}`,
        mustEscalate: true
      };
    }
  }

  // Detección Medium
  for (const signal of mediumRiskSignals) {
    if (normalized.includes(signal)) {
      return {
        level: 'medium',
        reason: `Detectada señal de atención: ${signal}`,
        mustEscalate: false // No necesariamente escalar, pero sí priorizar agendamiento/revisión
      };
    }
  }

  // Default Low
  return {
    level: 'low',
    reason: 'Consulta estándar',
    mustEscalate: false
  };
}

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
      timeout: 15000, // Aumentado timeout para análisis más complejo
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
    
    // Análisis de Triage y Jerga pre-LLM
    const triage = detectTriageLevel(message);
    const mappedTreatments = mapJargonToTreatments(message);
    
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

INFORMACIÓN PRE-PROCESADA:
- Triage Level Detectado: ${triage.level} (${triage.reason})
- Tratamientos Mapeados: ${mappedTreatments.join(', ') || 'Ninguno'}

EJEMPLOS DE CLASIFICACIÓN (few-shot):

User: "Tengo manchas en la cara, ¿qué tratamiento me recomiendan?"
→ kind: medical, subtype: skin_concern, problem: pigmentation, confidence: 0.95, needsConsultation: true, triageLevel: "low"

User: "Me salió pus en el relleno que me pusieron ayer"
→ kind: medical, subtype: post_treatment_complication, problem: infection, confidence: 0.99, needsConsultation: true, triageLevel: "high", mustEscalate: true

User: "Quiero saber el precio del botox"
→ kind: medical, subtype: price_inquiry, treatment: botox, confidence: 0.90, needsConsultation: false, triageLevel: "low"

User: "Me duele mucho la cabeza después del laser"
→ kind: medical, subtype: post_treatment_complication, problem: pain, confidence: 0.95, needsConsultation: true, triageLevel: "high", mustEscalate: true

User: "Bioestimuladores"
→ kind: medical, subtype: treatment_inquiry, category: collagen_stimulation, confidence: 0.90, needsConsultation: false, triageLevel: "low"

User: "Mi equipo HIFU no funciona"
→ kind: technical, subtype: support, question: equipment_failure, confidence: 0.95, needsConsultation: false

INSTRUCCIONES CRÍTICAS:
1. Si el usuario menciona un PROBLEMA ESTÉTICO (manchas, arrugas, acné, flacidez, etc.):
   → kind: medical, subtype: skin_concern, needsConsultation: true
   
2. Si hay SEÑALES DE ALARMA (dolor intenso, infección, sangrado, etc.):
   → kind: medical, subtype: post_treatment_complication, triageLevel: "high", mustEscalate: true

3. Si pregunta por PRECIO o COSTO de tratamiento:
   → kind: medical, subtype: price_inquiry, needsConsultation: false

4. Si muestra INTERÉS en un tratamiento específico:
   → kind: medical, subtype: treatment_interest, needsConsultation: true

5. Si es sobre EQUIPOS médicos (compra, falla, reparación):
   → kind: technical (NO es médico-estético)

RESPONDE EN FORMATO JSON PURO (sin markdown):
{
  "kind": "medical|technical|general",
  "subtype": "skin_concern|treatment_interest|treatment_recommendation|treatment_inquiry|price_inquiry|promotion_inquiry|appointment_request|policy_inquiry|location_inquiry|schedule_inquiry|contact_inquiry|post_treatment_complication|other",
  "problem": "pigmentation|wrinkles|acne|sagging|scars|oily_skin|dark_circles|cellulite|stretch_marks|infection|pain|other",
  "treatment": "botox|fillers|laser|facial|peeling|microneedling|prp|bioestimulators|other",
  "category": "facial|corporal|injectable|laser|regenerative|evaluation|other",
  "needsConsultation": true|false,
  "triageLevel": "low|medium|high",
  "mustEscalate": true|false,
  "entities": {
    "concerns": ["concern1"],
    "treatments": ["treatment1"],
    "bodyAreas": ["area1"],
    "keywords": []
  },
  "confidence": 0.85,
  "reasoning": "breve explicación"
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
    // Limpiar markdown si existe
    const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const classification = JSON.parse(jsonText);

    // Forzar triage level detectado por código si es más alto que el de IA
    if (triage.level === 'high') {
      classification.triageLevel = 'high';
      classification.mustEscalate = true;
    } else if (triage.level === 'medium' && classification.triageLevel !== 'high') {
      classification.triageLevel = 'medium';
    }

    console.log(`✅ [MedicalAI] Clasificación: ${classification.kind}/${classification.subtype} (Triage: ${classification.triageLevel})`);
    
    return classification;

  } catch (error) {
    console.error(`❌ [MedicalAI] Error en clasificación IA:`, error.message);
    
    // Fallback heurístico si IA falla
    return classifyMedicalFallback(message);
  }
}

/**
 * Fallback de clasificación (código original mantenido y mejorado)
 */
function classifyMedicalFallback(message) {
  const lower = message.toLowerCase();
  const triage = detectTriageLevel(message);
  
  if (triage.level === 'high') {
    return { kind: 'medical', subtype: 'post_treatment_complication', triageLevel: 'high', mustEscalate: true, confidence: 1.0 };
  }

  if (lower.includes('precio') || lower.includes('costo') || lower.includes('cuanto vale')) {
    return { kind: 'medical', subtype: 'price_inquiry', confidence: 0.8 };
  }
  if (lower.includes('agendar') || lower.includes('cita') || lower.includes('turno')) {
    return { kind: 'medical', subtype: 'appointment_request', confidence: 0.9 };
  }
  if (lower.includes('mancha') || lower.includes('acne') || lower.includes('arruga')) {
    return { kind: 'medical', subtype: 'skin_concern', needsConsultation: true, confidence: 0.8 };
  }
  
  return { kind: 'medical', subtype: 'general', confidence: 0.5 };
}

/**
 * Genera un ID único corto para las preguntas del bot
 */
function generateQuestionId() {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Genera respuesta médico-estética inteligente
 */
export async function generateMedicalReply(classification, conversationHistory = [], tools = null) {
  try {
    const client = getOpenAIClient();
    const greeting = getTimeBasedGreeting();
    
    // 1. Obtener catálogo relevante
    const catalogContext = generateCatalogText();
    
    // 2. Detectar Triage y Jerga (Refuerzo)
    const lastUserMsg = conversationHistory.filter(m => m.role === 'user').pop()?.content || '';
    const triage = detectTriageLevel(lastUserMsg);
    const mappedTreatments = mapJargonToTreatments(lastUserMsg);
    
    // 3. Definir System Prompt Especializado
    const systemPrompt = `Eres la Asistente Médica Virtual de BIOSKIN. Tu objetivo es realizar triage, educar y agendar citas.
    
POLÍTICAS CRÍTICAS (NO NEGOCIABLES):
1. NO DIAGNOSTICAR: Nunca des un diagnóstico médico definitivo. Usa frases como "Podría tratarse de...", "Es importante evaluar...".
2. NO RECETAR: Jamás recetes medicamentos ni dosis.
3. TRIAGE DE SEGURIDAD:
   - Si detectas ${triage.level === 'high' ? 'ALTO RIESGO (Sangrado, Infección, Dolor Intenso)' : 'riesgo'}: Tu prioridad es la SEGURIDAD del paciente.
   - ${triage.level === 'high' ? 'Indica que requiere atención inmediata. Ofrece contactar a Dra. Daniela o acudir a urgencias si es grave.' : ''}
4. OBJETIVO COMERCIAL: Tu meta es llevar al usuario a AGENDAR UNA CITA DE EVALUACIÓN ($10) o el tratamiento si ya está decidido.
5. EMPATÍA PROFESIONAL: Usa un tono cálido, profesional y seguro. Emojis moderados (✨, 👩‍⚕️, 🧴).

INFORMACIÓN DE CONTEXTO:
- Catálogo de Servicios: ${catalogContext.substring(0, 1500)}...
- Tratamientos Identificados en Jerga: ${mappedTreatments.join(', ')}
- Nivel de Triage Detectado: ${triage.level.toUpperCase()}
- Clasificación: ${JSON.stringify(classification)}

ESTRUCTURA DE RESPUESTA:
- Saludo cordial (si es inicio de conversación).
- Validación empática del problema ("Entiendo que las manchas pueden ser molestas...").
- Explicación breve y educativa (sin diagnosticar).
- Propuesta de solución: Menciona tratamientos disponibles en BIOSKIN (ej. Láser, Peeling) como opciones a evaluar.
- Call to Action (CTA): Invita a agendar una evaluación para determinar el mejor protocolo.
- Transparencia: "Recuerda que esto no sustituye una consulta médica".

FORMATO JSON REQUERIDO (ESTRICTO):
Responde ÚNICAMENTE con el objeto JSON. NO incluyas texto antes ni después del JSON.
{
  "responseText": "Texto de respuesta (máx 6-8 líneas)",
  "options": [
    { "id": "1", "label": "Agendar Cita ($10)", "action": "book_appointment" },
    { "id": "2", "label": "Más Información", "action": "more_info" },
    { "id": "3", "label": "Hablar con Dra. Daniela", "action": "transfer_doctor" }
  ],
  "metadata": {
    "triageLevel": "${triage.level}",
    "evaluationNeeded": true,
    "suggestedTreatments": ["t1", "t2"]
  }
}`;

    // 4. Generar respuesta
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(m => ({ role: m.role, content: m.content }))
      ],
      temperature: 0.3, // Reducido para mayor estabilidad en formato
      max_tokens: 500,
      response_format: { type: "json_object" } // Forzar modo JSON de OpenAI
    });

    const responseJson = completion.choices[0].message.content.trim();
    let responseData;
    
    try {
      // Intentar parsear JSON
      responseData = JSON.parse(responseJson);
      
      // ✅ VALIDACIÓN CRÍTICA: Asegurar que responseText NO contenga JSON
      if (responseData.responseText && (responseData.responseText.includes('{"responseText"') || responseData.responseText.includes('"options":'))) {
         console.warn('⚠️ [MedicalAI] JSON anidado detectado en responseText, limpiando...');
         // Intentar extraer solo el texto antes del JSON
         const cleanText = responseData.responseText.split('{')[0].trim();
         // Limpiar también si hay marcadores de "Aquí tienes las opciones:"
         const cleanText2 = cleanText.split('Aquí tienes las opciones')[0].trim();
         
         if (cleanText2.length > 0) {
            responseData.responseText = cleanText2;
         } else {
            responseData.responseText = "Entendido. ¿Te gustaría agendar una cita para evaluar tu caso?";
         }
      }

    } catch (e) {
      console.warn('⚠️ [MedicalAI] Falló parseo JSON, intentando recuperación heurística:', e.message);
      
      // Si falla el parseo, intentamos extraer el JSON con regex
      const jsonMatch = responseJson.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          responseData = JSON.parse(jsonMatch[0]);
        } catch (e2) {
           // Si aún falla, usar todo como texto plano PERO limpiando el JSON visible
           let cleanText = responseJson;
           // Intentar cortar donde empieza el JSON
           if (cleanText.includes('{')) {
             cleanText = cleanText.substring(0, cleanText.indexOf('{')).trim();
           }
           // Limpiar frases comunes de introducción al JSON
           cleanText = cleanText.replace(/Aquí tienes las opciones:?$/i, '').trim();

           if (!cleanText) cleanText = "Disculpa, no pude procesar tu solicitud correctamente. ¿Deseas hablar con un asesor?";

           responseData = {
            responseText: cleanText,
            options: [
              { id: '1', label: 'Agendar Cita', action: 'book_appointment' },
              { id: '2', label: 'Hablar con Asesor', action: 'transfer_agent' }
            ],
            metadata: { triageLevel: triage.level }
          };
        }
      } else {
        // Fallback total: Texto plano sin JSON
        let cleanText = completion.choices[0].message.content;
        // Limpieza agresiva de JSON si existe
        if (cleanText.includes('{')) {
             cleanText = cleanText.substring(0, cleanText.indexOf('{')).trim();
        }
        cleanText = cleanText.replace(/Aquí tienes las opciones:?$/i, '').trim();

        responseData = {
          responseText: cleanText,
          options: [
            { id: '1', label: 'Agendar Cita', action: 'book_appointment' },
            { id: '2', label: 'Hablar con Asesor', action: 'transfer_agent' }
          ],
          metadata: { triageLevel: triage.level }
        };
      }
    }

    // Post-procesamiento de seguridad
    if (triage.level === 'high') {
      responseData.metadata.mustEscalate = true;
      // Asegurar que la opción de hablar con doctora esté presente y primera
      responseData.options = [
        { id: '1', label: '🚨 Hablar con Dra. Daniela', action: 'transfer_doctor_urgent' },
        { id: '2', label: 'Agendar Revisión Urgente', action: 'book_appointment_urgent' }
      ];
    }

    // Asegurar campos requeridos
    responseData.lastQuestionId = generateQuestionId();
    responseData.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    responseData.suggestedActions = responseData.options.map(o => o.action);
    responseData.meta = {
      classification: classification.subtype,
      needsConsultation: classification.needsConsultation
    };

    return responseData;

  } catch (error) {
    console.error('❌ [MedicalAI] Error generando respuesta:', error);
    return {
      responseText: "Disculpa, tuve un problema técnico. ¿Te gustaría agendar una cita de evaluación para que la Dra. Daniela revise tu caso personalmente?",
      options: [{ id: '1', label: 'Agendar Cita', action: 'book_appointment' }],
      lastQuestionId: generateQuestionId(),
      expiresAt: new Date().toISOString(),
      metadata: { error: true },
      suggestedActions: ['book_appointment'],
      meta: {}
    };
  }
}

/**
 * Genera resumen para transferencia a la doctora
 */
export function generateDoctorTransferSummary(conversationHistory, classification, meta) {
  const recentMessages = conversationHistory.slice(-6);
  
  let summary = `📋 *RESUMEN MÉDICO - Transferencia a Dra. Daniela*\n\n`;
  summary += `🩺 *Tipo de consulta:* ${classification.subtype}\n`;
  summary += `📊 *Confianza:* ${(classification.confidence * 100).toFixed(0)}%\n`;
  
  if (classification.triageLevel) {
    summary += `🚨 *Nivel Triage:* ${classification.triageLevel.toUpperCase()}\n`;
  }
  
  if (classification.needsConsultation) {
    summary += `⚠️ *Requiere consulta:* SÍ\n`;
  }
  
  if (meta && meta.treatmentsFound > 0) {
    summary += `💉 *Tratamientos mencionados:* ${meta.treatmentIds.join(', ')}\n`;
  }
  
  summary += `\n💬 *Últimos mensajes:*\n`;
  recentMessages.filter(m => m.role === 'user').forEach((msg, idx) => {
    const preview = msg.content.length > 80 ? msg.content.substring(0, 80) + '...' : msg.content;
    summary += `${idx + 1}. "${preview}"\n`;
  });
  
  return summary;
}

/**
 * Genera enlace de WhatsApp para la doctora
 */
export function generateDoctorWhatsAppLink(conversationHistory, patientName = null) {
  const DOCTOR_PHONE = '593969890689'; // Dra. Daniela / Clínica
  
  let message = `Hola Dra. Daniela, me contacto desde el chatbot de BIOSKIN.\n\n`;
  
  if (patientName) {
    message += `👤 Soy: ${patientName}\n\n`;
  }
  
  // Generar resumen breve basado en historial
  const lastUserMsg = conversationHistory.filter(m => m.role === 'user').pop()?.content || '';
  message += `Me gustaría consultar sobre: "${lastUserMsg}"\n\n`;
  message += `_Mensaje enviado desde chatbot BIOSKIN_`;
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${DOCTOR_PHONE}?text=${encodedMessage}`;
}
