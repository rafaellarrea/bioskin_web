/**
 * SERVICIO DE IA PARA SOPORTE TÉCNICO - BIOSKIN
 * 
 * Clasificación y respuesta inteligente para consultas técnicas:
 * - Equipos médicos estéticos
 * - Soporte técnico (troubleshooting)
 * - Ventas y cotizaciones
 * - Instalación y capacitación
 * - Garantías y reparaciones
 * 
 * Prioriza generación dinámica con IA sobre respuestas predefinidas
 * 
 * ========================================
 * TESTS DE EJEMPLO Y CASOS DE USO
 * ========================================
 * 
 * CASO T1: Problema técnico con equipo
 * Input: "Mi HIFU no enciende desde ayer"
 * Expected Output:
 * {
 *   responseText: "Buenos días, soy Salomé de BIOSKIN. Entiendo que su equipo HIFU no está encendiendo...",
 *   suggestedActions: ['offer_engineer_contact'],
 *   meta: { classification: 'support', needsRepair: true, equipmentMentioned: true }
 * }
 * 
 * CASO T2: Consulta de stock
 * Input: "¿Tienen stock del analizador facial?"
 * Expected: classifyTechnical → subtype:'sales' → searchEquipment('analizador')
 * → checkStock() → reply con stock + price
 * Output:
 * {
 *   responseText: "Tenemos 2 unidades del Analizador Facial de 21\" en stock. Precio: $X...",
 *   suggestedActions: ['provide_quote', 'send_specs'],
 *   meta: { productId: '...', stock: true, price: 5000 }
 * }
 * 
 * CASO T3: Equipo no disponible
 * Input: "¿Tienen equipo de criolipólisis?"
 * Expected: detectUnknownEquipment → isUnknownEquipment:true
 * Output:
 * {
 *   responseText: "Actualmente no disponemos de ese equipo, pero podemos verificar importación...",
 *   suggestedActions: ['show_available_equipment'],
 *   meta: { unknownEquipment: 'criolipólisis' }
 * }
 * 
 * CASO T4: Operación potencialmente peligrosa
 * Input: "¿Cómo cambio la fuente de poder del láser?"
 * Expected: IA detecta riesgo → mustEscalate:true
 * Output:
 * {
 *   responseText: "Por seguridad, este tipo de manipulación debe realizarla personal técnico capacitado...",
 *   suggestedActions: ['transfer_engineer'],
 *   mustEscalate: true
 * }
 * 
 * CASO T5: Consulta mixta clínica + técnica
 * Input: "Mi cliente se quemó con el láser"
 * Expected: Priorizar derivación médica (Dra. Daniela) + notificar técnico secundario
 */

import OpenAI from 'openai';
import { 
  searchEquipment,
  findEquipmentByName,
  getStockInfo,
  formatProductForChat,
  getStockListForChat,
  detectUnknownEquipment,
  getProductsInStock,
  getPromotionalProducts
} from './products-adapter.js';

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
    
    console.log('✅ [TechnicalAI] Cliente OpenAI inicializado');
  }
  return openai;
}

/**
 * Clasificador basado en IA con few-shot learning
 * Determina si el mensaje es técnico y de qué tipo
 * 
 * @param {string} message - Mensaje del usuario
 * @param {Array} conversationHistory - Historial para contexto
 * @returns {Promise<Object>} { kind, subtype, question, entities, confidence }
 */
export async function classifyTechnical(message, conversationHistory = []) {
  console.log(`🔍 [TechnicalAI] Clasificando mensaje: "${message.substring(0, 60)}..."`);
  
  try {
    const client = getOpenAIClient();
    
    // Construir contexto de historial
    let contextText = '';
    if (conversationHistory.length > 0) {
      const recent = conversationHistory.slice(-4);
      contextText = recent.map(m => `${m.role}: ${m.content}`).join('\n');
    }

    // Prompt con few-shot examples MEJORADO
    const classificationPrompt = `Eres un clasificador técnico para BIOSKIN. Analiza si el mensaje es una consulta TÉCNICA sobre equipos médicos estéticos.

CONTEXTO DE CONVERSACIÓN PREVIA:
${contextText || 'Sin historial previo'}

MENSAJE ACTUAL DEL USUARIO:
"${message}"

EJEMPLOS DE CLASIFICACIÓN (few-shot):

User: "Mi equipo HIFU no enciende desde ayer"
→ kind: technical, subtype: support, question: equipment_failure, confidence: 0.95, needsRepair: true

User: "Tengo un electroporador que no funciona"
→ kind: technical, subtype: support, question: equipment_failure, confidence: 0.95, needsRepair: true

User: "¿Pueden revisar mi equipo de ultrasonido?"
→ kind: technical, subtype: support, question: service_request, confidence: 0.90, needsRepair: true

User: "Equipo láser defectuoso, necesito reparación"
→ kind: technical, subtype: support, question: repair_request, confidence: 0.95, needsRepair: true

User: "Quiero precio del láser CO2"
→ kind: technical, subtype: sales, question: price_inquiry, confidence: 0.90, needsRepair: false

User: "¿Tienen promociones en equipos?"
→ kind: technical, subtype: sales, question: promotions, confidence: 0.95, needsRepair: false

User: "Me gustaría saber si hay ofertas en aparatología"
→ kind: technical, subtype: sales, question: promotions, confidence: 0.92, needsRepair: false

User: "¿Qué equipos tienen en descuento?"
→ kind: technical, subtype: sales, question: promotions, confidence: 0.95, needsRepair: false

User: "¿Tienen repuestos para analizador facial?"
→ kind: technical, subtype: sales, question: spare_parts, confidence: 0.88, needsRepair: false

User: "El display del IPL muestra ERROR 23"
→ kind: technical, subtype: support, question: error_code, confidence: 0.92, needsRepair: true

User: "¿Cómo instalo el láser YAG? Necesito manual"
→ kind: technical, subtype: installation, question: installation_guide, confidence: 0.85, needsRepair: false

User: "Necesito que un técnico venga a reparar mi HIFU"
→ kind: technical, subtype: support, question: request_repair, confidence: 0.95, needsRepair: true

User: "¿Qué características tiene el analizador facial de 21 pulgadas?"
→ kind: technical, subtype: specs, question: specifications, confidence: 0.87, needsRepair: false

User: "Tengo manchas en la cara, ¿qué tratamiento me recomiendan?"
→ kind: medical, subtype: consultation, question: treatment_recommendation, confidence: 0.90, needsRepair: false

INSTRUCCIONES CRÍTICAS:
1. Si el usuario menciona que su equipo NO FUNCIONA, está DEFECTUOSO, DAÑADO o necesita REPARACIÓN:
   → kind: technical, subtype: support, needsRepair: true
   
2. Si solo pregunta por PRECIOS, VENTA, DISPONIBILIDAD sin mencionar problemas:
   → kind: technical, subtype: sales, needsRepair: false

3. Clasifica el subtipo:
   - support: problemas, errores, no funciona, diagnóstico, reparación
   - sales: precio, compra, cotización, disponibilidad, stock
   - installation: instalación, configuración, manual, guía
   - warranty: garantía, servicio post-venta
   - specs: características, especificaciones, capacidades

4. Extrae la pregunta específica
5. Identifica entidades: productos mencionados, modelos, códigos de error
6. Asigna confidence (0.0-1.0)

RESPONDE EN FORMATO JSON PURO (sin markdown):
{
  "kind": "technical|medical|general",
  "subtype": "support|sales|installation|warranty|specs|other",
  "question": "descripción_breve",
  "needsRepair": true|false,
  "entities": {
    "productNames": ["nombre1", "nombre2"],
    "models": [],
    "errorCodes": [],
    "keywords": []
  },
  "confidence": 0.85,
  "reasoning": "breve explicación de 1 línea"
}`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Eres un clasificador JSON. Responde SOLO JSON válido, sin markdown ni explicaciones adicionales.' },
        { role: 'user', content: classificationPrompt }
      ],
      temperature: 0.3, // Baja temperatura para clasificación consistente
      max_tokens: 300
    });

    const responseText = completion.choices[0].message.content.trim();
    console.log(`📊 [TechnicalAI] Respuesta raw de clasificación: ${responseText.substring(0, 100)}...`);
    
    // Limpiar markdown si existe
    const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const classification = JSON.parse(jsonText);

    console.log(`✅ [TechnicalAI] Clasificación: ${classification.kind}/${classification.subtype} (confidence: ${classification.confidence})`);
    
    return classification;

  } catch (error) {
    console.error(`❌ [TechnicalAI] Error en clasificación IA:`, error.message);
    
    // Fallback heurístico si IA falla
    return classifyTechnicalFallback(message);
  }
}

/**
 * Clasificación heurística de respaldo (basada en keywords)
 */
function classifyTechnicalFallback(message) {
  console.log(`🔄 [TechnicalAI] Usando clasificador fallback heurístico`);
  
  const lowerMsg = message.toLowerCase();
  
  // Detectar si es técnico
  const technicalKeywords = /(equipo|aparato|dispositivo|máquina|laser|láser|hifu|ipl|yag|analizador|rf|radiofrecuencia|co2)/i;
  const isTechnical = technicalKeywords.test(lowerMsg);
  
  if (!isTechnical) {
    return {
      kind: 'general',
      subtype: 'other',
      question: 'non_technical',
      entities: { productNames: [], models: [], errorCodes: [], keywords: [] },
      confidence: 0.50,
      reasoning: 'Clasificación fallback - no detectó palabras técnicas'
    };
  }

  // Determinar subtipo
  let subtype = 'other';
  let question = 'general_inquiry';

  if (/(no enciende|no funciona|error|problema|falla|roto|dañado)/i.test(lowerMsg)) {
    subtype = 'support';
    question = 'technical_issue';
  } else if (/(precio|costo|cotización|comprar|vender|disponible|stock|promocion|descuento|oferta)/i.test(lowerMsg)) {
    subtype = 'sales';
    question = /(promocion|descuento|oferta)/i.test(lowerMsg) ? 'promotions' : 'price_inquiry';
  } else if (/(instalar|instalación|configurar|manual|guía)/i.test(lowerMsg)) {
    subtype = 'installation';
    question = 'installation_guide';
  } else if (/(garantía|reparar|reparación|servicio|técnico|mantenimiento)/i.test(lowerMsg)) {
    subtype = 'warranty';
    question = 'warranty_inquiry';
  } else if (/(características|especificaciones|capacidades|qué hace|cómo funciona)/i.test(lowerMsg)) {
    subtype = 'specs';
    question = 'specifications';
  }

  // Detectar productos mencionados
  const productNames = [];
  if (/hifu/i.test(lowerMsg)) productNames.push('HIFU');
  if (/(laser|láser).*co2|co2.*laser/i.test(lowerMsg)) productNames.push('Láser CO2');
  if (/ipl/i.test(lowerMsg)) productNames.push('IPL');
  if (/analizador/i.test(lowerMsg)) productNames.push('Analizador Facial');
  if (/yag/i.test(lowerMsg)) productNames.push('Láser YAG');

  return {
    kind: 'technical',
    subtype,
    question,
    entities: { productNames, models: [], errorCodes: [], keywords: [] },
    confidence: 0.65,
    reasoning: 'Clasificación fallback heurística'
  };
}

/**
 * Genera respuesta técnica usando IA con contexto de productos REALES
 * NUEVO FLUJO: Generación dinámica con contexto completo (sin respuestas predeterminadas)
 * 
 * @param {Object} classification - Resultado de classifyTechnical
 * @param {Array} conversationHistory - Historial de conversación
 * @returns {Promise<Object>} { responseText, suggestedActions, meta }
 */
export async function generateTechnicalReply(classification, conversationHistory = []) {
  console.log(`🤖 [TechnicalAI] Generando respuesta para ${classification.subtype}`);
  
  try {
    const lastUserMsg = conversationHistory.filter(m => m.role === 'user').pop()?.content || '';
    const client = getOpenAIClient();
    const greeting = getTimeBasedGreeting();
    
    // ============================================
    // PASO 1: RECOPILAR CONTEXTO COMPLETO
    // ============================================
    
    // 1.1 Catálogo de productos en stock
    const availableEquipment = getProductsInStock();
    let catalogContext = `CATÁLOGO DE EQUIPOS DISPONIBLES EN STOCK:\n\n`;
    
    availableEquipment.forEach((product, idx) => {
      catalogContext += `${idx + 1}. ${product.name}\n`;
      catalogContext += `   Stock: ${product.stock.quantity} unidades\n`;
      catalogContext += `   Descripción: ${product.shortDescription}\n`;
      
      if (product.pricing) {
        catalogContext += `   Precio: $${product.pricing.current} ${product.pricing.currency}\n`;
        if (product.pricing.discount && product.pricing.discount.active) {
          catalogContext += `   🔥 OFERTA: Antes $${product.pricing.previous} (Ahorro: $${product.pricing.discount.savings})\n`;
        }
      }

      if (product.specifications) {
        catalogContext += `   Especificaciones:\n`;
        Object.entries(product.specifications).forEach(([key, val]) => {
          catalogContext += `     - ${key}: ${val}\n`;
        });
      }

      if (product.details && product.details.length > 0) {
        catalogContext += `   Características: ${product.details.join(', ')}\n`;
      }
      
      catalogContext += `\n`;
    });

    // 1.2 Promociones activas
    const promoProducts = getPromotionalProducts();
    let promoContext = "";
    if (promoProducts.length > 0) {
      promoContext = "PROMOCIONES ACTIVAS:\n";
      promoProducts.forEach(p => {
        promoContext += `- ${p.name}: $${p.pricing.current} (Antes $${p.pricing.previous})\n`;
      });
    }

    // 1.3 Equipo específico mencionado (si existe)
    let specificContext = "";
    const specificEquipment = findEquipmentByName(lastUserMsg);
    if (specificEquipment) {
      specificContext = `EQUIPO ESPECÍFICO CONSULTADO:\n${JSON.stringify(specificEquipment, null, 2)}\n`;
    }

    // 1.4 Equipo desconocido (si aplica)
    const unknownCheck = detectUnknownEquipment(lastUserMsg);
    let unknownContext = "";
    if (unknownCheck.isUnknownEquipment) {
      unknownContext = `⚠️ EL USUARIO PREGUNTA POR UN EQUIPO QUE NO TENEMOS: "${unknownCheck.equipmentName}".\nINSTRUCCIÓN: Informa amablemente que no lo tenemos en stock, pero ofrece verificar importación bajo pedido.\n`;
    }

    // ============================================
    // PASO 2: DEFINIR GUÍA DE COMPORTAMIENTO (INTENT)
    // ============================================
    let guidance = "";

    if (classification.subtype === 'support' || classification.needsRepair) {
      guidance = `
🎯 OBJETIVO: SOPORTE TÉCNICO
- Muestra empatía por el problema técnico.
- NO intentes reparar el equipo por chat.
- Ofrece diagnóstico y revisión técnica presencial.
- Menciona que atendemos equipos de cualquier marca.
- CIERRE: "¿Le gustaría que nuestro departamento técnico le contacte para coordinar una revisión?"
`;
    } else if (classification.subtype === 'sales' || classification.question === 'price_inquiry') {
      guidance = `
🎯 OBJETIVO: VENTAS Y ASESORAMIENTO
- Usa la información del catálogo para resaltar beneficios.
- Si preguntan precio, dalo directamente (si está en el catálogo).
- Si hay promoción, menciónala con entusiasmo.
- Si no sabes el precio exacto, ofrece cotización formal.
- CIERRE: "¿Le gustaría recibir una cotización formal o tiene alguna otra duda?"
`;
    } else if (classification.subtype === 'installation' || classification.subtype === 'specs') {
      guidance = `
🎯 OBJETIVO: INFORMACIÓN TÉCNICA
- Responde la duda técnica usando las especificaciones del catálogo.
- Si es sobre instalación, ofrece soporte o manuales si corresponde.
`;
    } else {
      guidance = `
🎯 OBJETIVO: ASISTENCIA GENERAL
- Responde amablemente a la consulta.
- Guía al usuario hacia nuestros equipos o servicios técnicos.
`;
    }

    // ============================================
    // PASO 3: CONSTRUIR SYSTEM PROMPT UNIFICADO
    // ============================================
    const technicalSystemPrompt = `Eres Salomé, asistente técnico y comercial de BIOSKIN.
Tu rol es asesorar sobre EQUIPOS MÉDICOS ESTÉTICOS (Venta y Soporte).

INFORMACIÓN DE BIOSKIN:
📍 Ubicación: Cuenca, Ecuador (Av. Ordoñez Lasso y calle de la Menta)
📞 Teléfono: +593 969 890 689
🔧 Servicios: Venta, Renta, Mantenimiento y Reparación de equipos estéticos.

${catalogContext}
${promoContext}
${specificContext}
${unknownContext}

${guidance}

INSTRUCCIONES GENERALES:
1. Tu tono es PROFESIONAL, TÉCNICO pero CERCANO.
2. Usa la información REAL del catálogo arriba. NO inventes precios ni specs.
3. Si el usuario pregunta por algo que no está en la lista, di que no lo tenemos en stock pero podemos importarlo.
4. Sé conciso (máximo 4-5 líneas).
5. Usa emojis técnicos con moderación (🔧, ⚙️, 💡, 📊).
6. NUNCA respondas consultas médicas de pacientes (tratamientos, diagnósticos de piel). Si detectas una consulta médica, di amablemente que la Dra. Daniela puede ayudarle con eso.

Responde al usuario de forma natural y fluida.`;

    // ============================================
    // PASO 4: GENERAR RESPUESTA CON IA
    // ============================================
    
    const messages = [
      { role: 'system', content: technicalSystemPrompt }
    ];

    // Agregar historial reciente
    const recentHistory = conversationHistory.slice(-6);
    recentHistory.forEach(msg => {
      messages.push({ role: msg.role, content: msg.content });
    });

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 350
    });

    const responseText = completion.choices[0].message.content;
    console.log(`✅ [TechnicalAI] Respuesta generada: ${responseText.substring(0, 80)}...`);

    // Determinar acciones sugeridas basadas en el contenido
    const suggestedActions = [];
    const lowerResp = responseText.toLowerCase();
    
    if (lowerResp.includes('técnico') || lowerResp.includes('revisión') || lowerResp.includes('reparación')) {
      suggestedActions.push('offer_engineer_contact');
    }
    if (lowerResp.includes('cotización') || lowerResp.includes('precio')) {
      suggestedActions.push('provide_quote');
    }
    if (lowerResp.includes('importar') || lowerResp.includes('pedido')) {
      suggestedActions.push('check_import');
    }

    return {
      responseText,
      suggestedActions,
      meta: {
        classification: classification.subtype,
        confidence: classification.confidence,
        productsAvailable: availableEquipment.length,
        tokensUsed: completion.usage?.total_tokens || 0,
        aiGenerated: true
      }
    };

  } catch (error) {
    console.error(`❌ [TechnicalAI] Error generando respuesta:`, error.message);
    
    // Fallback básico
    return {
      responseText: `Disculpe, tengo un problema técnico temporal. Por favor, contacte directamente al Ing. Rafael Larrea al +593969890689 para asistencia técnica inmediata. 🔧`,
      suggestedActions: ['transfer_engineer'],
      meta: {
        error: error.message,
        fallback: true
      }
    };
  }
}

/**
 * Genera resumen para transferencia al ingeniero
 */
export function generateEngineerTransferSummary(conversationHistory, classification, meta) {
  const recentMessages = conversationHistory.slice(-6);
  
  let summary = `📋 *RESUMEN TÉCNICO - Transferencia al Ing. Rafael*\n\n`;
  summary += `🔧 *Tipo de consulta:* ${classification.subtype}\n`;
  summary += `📊 *Confianza:* ${(classification.confidence * 100).toFixed(0)}%\n\n`;
  
  if (meta.productsFound > 0) {
    summary += `📦 *Productos mencionados:* ${meta.productIds.join(', ')}\n\n`;
  }
  
  summary += `💬 *Últimos mensajes:*\n`;
  recentMessages.filter(m => m.role === 'user').forEach((msg, idx) => {
    const preview = msg.content.length > 80 ? msg.content.substring(0, 80) + '...' : msg.content;
    summary += `${idx + 1}. "${preview}"\n`;
  });
  
  summary += `\n🎯 *Acción requerida:* ${classification.question.replace(/_/g, ' ')}`;
  
  return summary;
}

/**
 * Genera enlace de WhatsApp para ingeniero
 */
export function generateEngineerWhatsAppLink(summary, patientPhone = '') {
  const ENGINEER_PHONE = '593969890689'; // Ing. Rafael
  
  let message = `Hola Ing. Rafael, me contacto desde el chatbot de BIOSKIN.\n\n`;
  
  if (patientPhone) {
    message += `📱 Mi número: ${patientPhone}\n\n`;
  }
  
  message += summary;
  message += `\n\n_Mensaje enviado desde chatbot BIOSKIN_`;
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${ENGINEER_PHONE}?text=${encodedMessage}`;
}
