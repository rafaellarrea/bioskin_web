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

User: "Bioestimuladores"
→ kind: medical, subtype: treatment_inquiry, category: collagen_stimulation, confidence: 0.90, needsConsultation: false

User: "Qué tratamientos láser tienen"
→ kind: medical, subtype: treatment_inquiry, category: laser, confidence: 0.88, needsConsultation: false

User: "Tratamientos para estimular colágeno"
→ kind: medical, subtype: treatment_inquiry, category: collagen_stimulation, confidence: 0.92, needsConsultation: false

User: "¿Dónde están ubicados?"
→ kind: medical, subtype: location_inquiry, confidence: 0.98, needsConsultation: false

User: "Cuál es su dirección"
→ kind: medical, subtype: location_inquiry, confidence: 0.98, needsConsultation: false

User: "Qué horarios tienen"
→ kind: medical, subtype: schedule_inquiry, confidence: 0.97, needsConsultation: false

User: "Cuál es su teléfono"
→ kind: medical, subtype: contact_inquiry, confidence: 0.98, needsConsultation: false

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

7. Si pregunta por UBICACIÓN, DIRECCIÓN, o CÓMO LLEGAR:
   → kind: medical, subtype: location_inquiry

8. Si pregunta por HORARIOS o DÍAS de atención:
   → kind: medical, subtype: schedule_inquiry

9. Si pregunta por TELÉFONO, CONTACTO, EMAIL, WHATSAPP:
   → kind: medical, subtype: contact_inquiry

10. Clasifica el subtipo:
   - skin_concern: problemas/preocupaciones estéticas
   - treatment_interest: quiere hacerse un tratamiento
   - treatment_recommendation: pide recomendación
   - treatment_inquiry: pregunta sobre tratamiento
   - price_inquiry: pregunta por precios
   - promotion_inquiry: pregunta por promociones
   - appointment_request: quiere agendar cita
   - location_inquiry: pregunta por ubicación/dirección
   - schedule_inquiry: pregunta por horarios
   - contact_inquiry: pregunta por teléfono/contacto

11. Identifica el problema o tratamiento mencionado
12. Asigna confidence (0.0-1.0)
13. needsConsultation: true si necesita evaluación médica personalizada

RESPONDE EN FORMATO JSON PURO (sin markdown):
{
  "kind": "medical|technical|general",
  "subtype": "skin_concern|treatment_interest|treatment_recommendation|treatment_inquiry|price_inquiry|promotion_inquiry|appointment_request|location_inquiry|schedule_inquiry|contact_inquiry|other",
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
 * FILOSOFÍA: La IA tiene TODO el contexto y es suficientemente inteligente para responder correctamente
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
    
    // ============================================
    // PASO 5: GENERAR RESPUESTA CON IA + CONTEXTO COMPLETO
    // ============================================
    
    console.log('🤖 [MedicalAI] PASO 5: Generando respuesta con IA usando catálogo completo');
    
    // Cargar servicios disponibles
    const availableServices = getAllServices();
    console.log(`📚 [MedicalAI] ${availableServices.length} servicios cargados del catálogo`);
    
    // Construir contexto detallado con promociones activas
    let servicesContext = 'CATÁLOGO COMPLETO DE SERVICIOS BIOSKIN:\n\n';
    let activePromotions = [];
    
    availableServices.forEach((service, index) => {
      servicesContext += `${index + 1}. ${service.title}\n`;
      servicesContext += `   ID: ${service.id}\n`;
      servicesContext += `   Precio: ${service.price}\n`;
      servicesContext += `   Duración: ${service.duration}\n`;
      servicesContext += `   Descripción: ${service.shortDescription}\n`;
      if (service.keywords && service.keywords.length > 0) {
        servicesContext += `   Keywords: ${service.keywords.join(', ')}\n`;
      }
      if (service.benefits && service.benefits.length > 0) {
        servicesContext += `   Beneficios: ${service.benefits.join(', ')}\n`;
      }
      
      // Verificar y agregar promociones activas
      if (service.promotion && service.promotion.active) {
        const promo = service.promotion;
        const now = new Date();
        const validFrom = new Date(promo.validFrom);
        const validUntil = new Date(promo.validUntil);
        
        if (now >= validFrom && now <= validUntil) {
          servicesContext += `   🎁 PROMOCIÓN ACTIVA: ${promo.name}\n`;
          servicesContext += `   💰 Precio promocional: ${promo.promoPrice}\n`;
          servicesContext += `   ⏰ Válida hasta: ${validUntil.toLocaleDateString('es-EC')}\n`;
          servicesContext += `   📋 Mensaje: ${promo.displayMessage}\n`;
          
          activePromotions.push({
            serviceId: service.id,
            serviceName: service.title,
            promoName: promo.name,
            promoPrice: promo.promoPrice,
            regularPrice: service.price,
            validUntil: validUntil.toLocaleDateString('es-EC'),
            displayMessage: promo.displayMessage
          });
        }
      }
      
      servicesContext += '\n';
    });
    
    // Agregar header de promociones si existen
    if (activePromotions.length > 0) {
      let promotionsHeader = '🎉 PROMOCIONES ACTIVAS:\n\n';
      activePromotions.forEach(promo => {
        promotionsHeader += `• ${promo.serviceName}: ${promo.displayMessage}\n`;
        promotionsHeader += `  Precio promocional: ${promo.promoPrice} (Regular: ${promo.regularPrice})\n`;
        promotionsHeader += `  Válida hasta: ${promo.validUntil}\n\n`;
      });
      servicesContext = promotionsHeader + servicesContext;
    }
    
    console.log(`🎁 [MedicalAI] ${activePromotions.length} promociones activas encontradas`);
    
    // System prompt con contexto completo e instrucciones inteligentes
    const medicalSystemPrompt = `Eres Salomé, asistente médico-estética de BIOSKIN especializada en tratamientos faciales y corporales.

${servicesContext}

TU ROL:
- Nombre: Salomé de BIOSKIN
- Trato: Formal y profesional (use "usted")
- Especialidad: Medicina estética, tratamientos faciales y corporales
- Objetivo: ASESORAR y CERRAR AGENDAMIENTOS (Ventas)

INFORMACIÓN DE BIOSKIN:
📍 **Ubicación**: Cuenca, Ecuador
   - Dirección: Av. Ordoñez Lasso y calle de la Menta
   - Coordenadas: -2.881413, -79.061966
📞 **Teléfono**: +593 969 890 689
📧 **Email**: salud.bioskin@gmail.com
🕐 **Horarios**:
   - Lunes a Viernes: 9:00 AM - 7:00 PM
   - Sábados: 9:00 AM - 4:00 PM
   - Domingos: Cerrado

👩‍⚕️ **AUTORIDAD MÉDICA (Dra. Daniela Creamer)**:
   - Médico General con Diplomado en Cosmiatría y Dermatocosmiatría Clínica.
   - Más de 2 años de experiencia especializada en tratamientos faciales.
   - Experta en aparatología avanzada: Láser CO2, Láser NdYag, Radiofrecuencia, HIFU.
   - Atención directa y personalizada (no es atendido por auxiliares, sino por la profesional).

💎 **POR QUÉ ELEGIR BIOSKIN (Diferenciadores)**:
   1. **Tecnología Avanzada**: Usamos equipos originales y modernos (Escáner facial inteligente, Láser, IPL).
   2. **Insumos Premium**: Solo marcas confiables y de alta calidad (Botox, ácidos, cremas).
   3. **Atención Profesional**: Diagnóstico y tratamiento realizado directamente por la Dra. Daniela.
   4. **Seguimiento**: Monitoreo post-tratamiento para asegurar resultados.

💰 **POLÍTICA DE PRECIOS Y PAGOS**:
   - **Consulta de Evaluación**: $10 USD.
   - 🚨 **GANCHO DE CIERRE**: "El valor de la consulta ($10) se ABONA al 100% al costo de su tratamiento si decide realizárselo." (Es decir, la consulta le sale GRATIS si se trata).
   - **Formas de Pago**: Por el momento NO aceptamos tarjetas ni diferidos.
   - **Argumento de Valor**: "Aunque no aceptamos tarjetas, nuestros precios son altamente competitivos comparados con el mercado, garantizando tecnología de punta y seguridad médica."

🛡️ **SEGURIDAD Y DOLOR**:
   - La mayoría de tratamientos son indoloros.
   - Se usa anestesia tópica si es necesario para minimizar molestias.
   - Tiempos de recuperación mínimos en casi todos los procedimientos.

INSTRUCCIONES INTELIGENTES DE RESPUESTA:

📋 **Si preguntan QUÉ SERVICIOS/TRATAMIENTOS tienen (consulta general):**
   → Responde con SOLO una lista de nombres (sin precios, sin descripciones)
   → Formato: "Contamos con:\n• [Nombre]\n• [Nombre]\n..."
   → Termina con: "¿Cuál le interesa conocer en detalle?"
   → NO incluyas precios ni duraciones en esta respuesta

💰 **Si preguntan por PRECIO o DETALLES de UN tratamiento específico:**
   → 🚨 PRIMERO verifica si tiene PROMOCIÓN ACTIVA en el catálogo
   → Si tiene promoción: Menciona PRIMERO el precio promocional
   → Si NO tiene promoción: Menciona el precio regular
   → Da información COMPLETA: nombre, descripción, precio, duración
   → Menciona 2-3 beneficios clave
   → 🚨 **CIERRE OBLIGATORIO**: Menciona SIEMPRE que los $10 de la consulta se reconocen como parte de pago.
   → Ejemplo de Cierre: "Recuerde que el valor de la consulta ($10) ya está incluido en este precio si se realiza el tratamiento. ¿Le gustaría agendar su evaluación?"

🛡️ **MANEJO DE OBJECIONES (Muy Importante):**
   - **"Está muy caro"**:
     "Entiendo su preocupación. Tenga en cuenta que en BIOSKIN utilizamos tecnología original y productos de alta gama garantizados, aplicados directamente por la Dra. Daniela (Médico especialista). Además, los $10 de la consulta se abonan a su tratamiento."
   - **"¿Duele?"**:
     "La mayoría de nuestros tratamientos son muy tolerables. Usamos anestesia tópica para su comodidad y la recuperación es inmediata en casi todos los casos."
   - **"¿Aceptan tarjeta?"**:
     "Por el momento trabajamos con efectivo o transferencia para mantener nuestros precios competitivos sin recargos adicionales."

ℹ️ **Si preguntan por MÁS INFORMACIÓN de un tratamiento:**
   → Proporciona detalles adicionales: indicaciones, proceso, resultados esperados
   → Usa TODA la información del catálogo disponible
   → Menciona beneficios, duración, precio
   → Si hay promoción activa, menciónala
   → Mantén tono profesional y educativo
   → IMPORTANTE: Busca en TODO el catálogo por palabras clave similares

🚫 **Si preguntan por tratamiento que NO EXISTE en el catálogo:**
   → Responde honestamente que NO ofrecemos ese tratamiento
   → Sugiere 1-2 tratamientos SIMILARES que SÍ tenemos del catálogo

📅 **Si mencionan AGENDAR o RESERVAR:**
   → Menciona que puedes ayudarles a agendar
   → Pregunta si desean continuar con el proceso
   → Ejemplo: "¡Claro! Puedo ayudarle a agendar con la Dra. Daniela. ¿Desea que le guíe paso a paso?"

📍 **Si preguntan por UBICACIÓN, DIRECCIÓN o CÓMO LLEGAR:**
   → Indica claramente: "Estamos en Cuenca, Ecuador"
   → Dirección completa: "Av. Ordoñez Lasso y calle de la Menta"

REGLAS GENERALES (MUY IMPORTANTE):
- 🔍 **CONTEXTO PRIMERO**: SIEMPRE revisa el catálogo COMPLETO antes de responder
- 🔍 **BUSCA SINÓNIMOS**: Si usuario menciona "bioestimuladores", busca todos los tratamientos que estimulan colágeno
- 📋 **INFORMACIÓN COMPLETA**: Cuando respondas sobre un tratamiento, incluye precio, duración, beneficios y promociones si existen
- 💬 Responde de forma BREVE pero COMPLETA (máximo 10 líneas)
- 👨‍⚕️ NO diagnostiques ni recomiendes tratamientos específicos sin evaluación médica
- ✅ SIEMPRE menciona: "Todos los tratamientos incluyen diagnóstico facial y evaluación previa"
- 😊 Usa emojis profesionales con moderación (✨💆🏥💉💵⏱️🎁)
- 🤝 Mantén tono conversacional natural, NO suenes como robot predefinido
- 🎩 **TONO**: Formal ("usted"), profesional pero cercano.

EJEMPLO DE RESPUESTA CORRECTA (Venta):
"✨ *Hollywood Peel*
Láser de carbón activado que elimina impurezas y da luminosidad instantánea.

💵 Precio: $30
⏱️ Duración: 90 minutos

Beneficios:
• Piel de porcelana inmediata
• Cierra poros y controla grasa

💡 *Dato*: Es un tratamiento indoloro y sin tiempo de recuperación.
💰 Recuerde que los $10 de la consulta se abonan al 100% a este valor.

¿Le gustaría agendar su cita con la Dra. Daniela?"`;

    // Construir mensajes para el chat
    const messages = [
      { role: 'system', content: medicalSystemPrompt },
      ...conversationHistory.map(m => ({ role: m.role, content: m.content }))
    ];

    // Si es el primer mensaje, agregar el saludo al contexto
    if (isFirstContact) {
      // No agregamos mensaje explícito, dejamos que la IA genere el saludo
    }

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 400
    });

    const responseText = completion.choices[0].message.content.trim();
    console.log(`✅ [MedicalAI] Respuesta generada: "${responseText.substring(0, 50)}..."`);

    // Generar opciones sugeridas basadas en el contenido
    const options = [];
    const lowerResponse = responseText.toLowerCase();

    if (lowerResponse.includes('agendar') || lowerResponse.includes('cita') || lowerResponse.includes('reserva')) {
      options.push({ 
        id: '1', 
        label: '📅 Agendar Cita', 
        action: 'book_appointment',
        payload: { type: 'consultation' }
      });
    }

    if (classification.treatment) {
      options.push({
        id: '2',
        label: 'ℹ️ Más detalles',
        action: 'more_info',
        payload: { treatment: classification.treatment }
      });
    }

    options.push({
      id: '3',
      label: '👩‍⚕️ Hablar con Dra.',
      action: 'transfer_doctor',
      payload: {}
    });

    return {
      responseText,
      options,
      lastQuestionId: generateQuestionId(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        classification,
        activePromotions: activePromotions.length
      },
      suggestedActions: options.map(o => o.action),
      meta: {
        classification: classification.subtype,
        needsConsultation: classification.needsConsultation
      }
    };

  } catch (error) {
    console.error('❌ [MedicalAI] Error generando respuesta:', error);
    return {
      responseText: "Disculpe, tuve un problema técnico momentáneo. ¿Podría repetir su consulta?",
      options: [],
      lastQuestionId: generateQuestionId(),
      expiresAt: new Date().toISOString(),
      metadata: { error: error.message },
      suggestedActions: [],
      meta: {}
    };
  }
}
