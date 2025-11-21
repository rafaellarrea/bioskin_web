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
 */

import OpenAI from 'openai';
import { 
  searchEquipment,
  findEquipmentByName,
  getStockInfo,
  formatProductForChat,
  getStockListForChat,
  detectUnknownEquipment,
  getProductsInStock
} from './products-adapter.js';

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

    // Prompt con few-shot examples
    const classificationPrompt = `Eres un clasificador técnico para BIOSKIN. Analiza si el mensaje es una consulta TÉCNICA sobre equipos médicos estéticos.

CONTEXTO DE CONVERSACIÓN PREVIA:
${contextText || 'Sin historial previo'}

MENSAJE ACTUAL DEL USUARIO:
"${message}"

EJEMPLOS DE CLASIFICACIÓN (few-shot):

User: "Mi equipo HIFU no enciende desde ayer"
→ kind: technical, subtype: support, question: power_issue, confidence: 0.95

User: "Quiero precio del láser CO2"
→ kind: technical, subtype: sales, question: price_inquiry, confidence: 0.90

User: "¿Tienen repuestos para analizador facial?"
→ kind: technical, subtype: sales, question: spare_parts, confidence: 0.88

User: "El display del IPL muestra ERROR 23"
→ kind: technical, subtype: support, question: error_code, confidence: 0.92

User: "¿Cómo instalo el láser YAG? Necesito manual"
→ kind: technical, subtype: installation, question: installation_guide, confidence: 0.85

User: "Necesito que un técnico venga a reparar mi HIFU"
→ kind: technical, subtype: repair, question: request_repair, confidence: 0.93

User: "¿Qué características tiene el analizador facial de 21 pulgadas?"
→ kind: technical, subtype: specs, question: specifications, confidence: 0.87

User: "Tengo manchas en la cara, ¿qué tratamiento me recomiendan?"
→ kind: medical, subtype: consultation, question: treatment_recommendation, confidence: 0.90

INSTRUCCIONES:
1. Determina si es consulta TÉCNICA (equipos/dispositivos) o MÉDICA (tratamientos/paciente)
2. Si es técnica, clasifica el subtipo:
   - support: problemas, errores, no funciona, diagnóstico
   - sales: precio, compra, cotización, disponibilidad, stock
   - installation: instalación, configuración, manual, guía
   - warranty: garantía, reparación, servicio post-venta
   - specs: características, especificaciones, capacidades
   - other: otros técnicos

3. Extrae la pregunta específica (power_issue, price_inquiry, error_code, etc.)
4. Identifica entidades: productos mencionados, modelos, códigos de error
5. Asigna confidence (0.0-1.0) según qué tan seguro estás

RESPONDE EN FORMATO JSON PURO (sin markdown):
{
  "kind": "technical|medical|general",
  "subtype": "support|sales|installation|warranty|specs|other",
  "question": "descripción_breve",
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
  } else if (/(precio|costo|cotización|comprar|vender|disponible|stock)/i.test(lowerMsg)) {
    subtype = 'sales';
    question = 'price_inquiry';
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
 * NUEVO FLUJO: Pregunta primero antes de listar equipos
 * 
 * @param {Object} classification - Resultado de classifyTechnical
 * @param {Array} conversationHistory - Historial de conversación
 * @returns {Promise<Object>} { responseText, suggestedActions, meta }
 */
export async function generateTechnicalReply(classification, conversationHistory = []) {
  console.log(`🤖 [TechnicalAI] Generando respuesta para ${classification.subtype}`);
  
  try {
    const lastUserMsg = conversationHistory.filter(m => m.role === 'user').pop()?.content || '';
    
    // PASO 1: Detectar si el usuario pregunta por un equipo que NO tenemos
    const unknownCheck = detectUnknownEquipment(lastUserMsg);
    
    if (unknownCheck.isUnknownEquipment) {
      console.log(`⚠️ [TechnicalAI] Equipo no disponible detectado: ${unknownCheck.equipmentName}`);
      
      // Generar respuesta breve con IA sobre el equipo mencionado
      const client = getOpenAIClient();
      const unknownEquipmentPrompt = `El usuario pregunta por: "${unknownCheck.equipmentName || lastUserMsg}"

Este equipo NO está en nuestro catálogo actual de BIOSKIN.

Genera una respuesta BREVE (2-3 líneas) que:
1. Dé información general básica sobre ese tipo de equipo (si lo conoces)
2. Indique que actualmente no disponemos de ese equipo
3. Ofrezca verificar si es posible importarlo contactando al Ing. Rafael

Tono: Profesional, servicial, sin presionar.`;

      const unknownResponse = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Eres un asesor técnico de equipos médicos estéticos.' },
          { role: 'user', content: unknownEquipmentPrompt }
        ],
        temperature: 0.7,
        max_tokens: 150
      });
      
      let responseText = unknownResponse.choices[0].message.content;
      responseText += `\n\n¿Le gustaría conocer los equipos que sí tenemos disponibles actualmente? 🔧`;
      
      return {
        responseText,
        suggestedActions: ['show_available_equipment'],
        meta: {
          classification: classification.subtype,
          unknownEquipment: unknownCheck.equipmentName,
          confidence: classification.confidence,
          tokensUsed: unknownResponse.usage?.total_tokens || 0
        }
      };
    }
    
    // PASO 2: Verificar si es la primera pregunta técnica (flujo inicial)
    const technicalMessagesCount = conversationHistory.filter(msg => 
      msg.role === 'user' && 
      (/equipo|dispositivo|aparato|hifu|laser|ipl|yag|co2|analizador/i.test(msg.content))
    ).length;
    
    // Si es primera pregunta técnica general, preguntar antes de listar
    if (technicalMessagesCount === 1 && !/(hifu|laser|láser|co2|ipl|yag|analizador|multifuncional)/i.test(lastUserMsg)) {
      console.log('🔄 [TechnicalAI] Primera consulta técnica - preguntando preferencias');
      
      return {
        responseText: `¡Perfecto! 😊 Será un placer asistirle con información sobre equipos médicos estéticos.\n\n¿Tiene algún equipo específico en mente o desea que le indique qué equipos tenemos disponibles en stock actualmente? 🔧`,
        suggestedActions: ['ask_preference'],
        meta: {
          classification: classification.subtype,
          firstTechnicalInteraction: true,
          confidence: classification.confidence
        }
      };
    }
    
    // PASO 3: Si pide ver equipos disponibles o es segunda interacción
    if (/(disponible|stock|tienen|cuáles|qué equipos|mostrar|ver|precio|precios)/i.test(lastUserMsg) || technicalMessagesCount === 2) {
      console.log('📋 [TechnicalAI] Mostrando lista de equipos en stock');
      
      // Detectar si el usuario preguntó por precios
      const askingForPrice = /(precio|precios|costo|costos|valor|cuánto|cuanto)/i.test(lastUserMsg);
      
      const stockList = getStockListForChat(askingForPrice);
      let responseText = stockList;
      
      if (askingForPrice) {
        responseText += `\n💡 *Nota:* Precios especiales con descuento por tiempo limitado.\n`;
        responseText += `\n¿Sobre cuál equipo le gustaría información más detallada? 📋`;
      } else {
        responseText += `\n¿Sobre cuál de estos equipos le gustaría más información? 💡`;
      }
      
      return {
        responseText,
        suggestedActions: ['provide_details'],
        meta: {
          classification: classification.subtype,
          productsShown: getProductsInStock().length,
          pricesIncluded: askingForPrice,
          confidence: classification.confidence
        }
      };
    }
    
    // PASO 4: Usuario menciona equipo específico - buscar y mostrar detalles
    const specificEquipment = findEquipmentByName(lastUserMsg);
    
    if (specificEquipment) {
      console.log(`✅ [TechnicalAI] Equipo específico encontrado: ${specificEquipment.name}`);
      
      // Detectar si pregunta por precio explícitamente
      const askingForPrice = /(precio|costo|cotización|cuánto cuesta|valor|cuánto vale|cuanto|precio de venta)/i.test(lastUserMsg);
      
      const productDetails = formatProductForChat(specificEquipment, true, askingForPrice);
      const stockInfo = getStockInfo(specificEquipment.name);
      
      let responseText = productDetails;
      
      // Agregar pregunta contextual según el subtipo y si pidió precio
      if (classification.subtype === 'sales' && !askingForPrice) {
        responseText += `\n¿Desea conocer el precio y las condiciones de venta? 💰`;
      } else if (askingForPrice) {
        responseText += `\n¿Le gustaría que le envíe una cotización formal o tiene alguna otra consulta? 📋`;
      } else if (classification.subtype === 'specs') {
        responseText += `\n¿Le gustaría conocer las especificaciones técnicas completas o tiene alguna pregunta específica? ⚙️`;
      } else {
        responseText += `\n¿Tiene alguna pregunta adicional sobre este equipo? 🔧`;
      }
      
      return {
        responseText,
        suggestedActions: stockInfo?.available ? ['provide_quote', 'send_specs'] : ['check_import'],
        meta: {
          classification: classification.subtype,
          productFound: specificEquipment.name,
          inStock: stockInfo?.available || false,
          priceIncluded: askingForPrice,
          confidence: classification.confidence
        }
      };
    }
    
    // PASO 5: Consulta técnica avanzada - usar IA con contexto
    console.log('🤖 [TechnicalAI] Generando respuesta con IA...');
    
    // Obtener equipos disponibles como contexto
    const availableEquipment = getProductsInStock();
    let contextForAI = `EQUIPOS DISPONIBLES EN STOCK:\n\n`;
    
    availableEquipment.forEach((product, idx) => {
      contextForAI += `${idx + 1}. ${product.name}\n`;
      contextForAI += `   Stock: ${product.stock.quantity} unidades\n`;
      contextForAI += `   Descripción: ${product.shortDescription}\n\n`;
    });
    
    // System prompt optimizado
    const technicalSystemPrompt = `Eres el asistente técnico de BIOSKIN especializado en equipos médicos estéticos.

${contextForAI}

TU ROL:
- Nombre: Soporte técnico BIOSKIN
- Trato: Formal y profesional (use "usted")
- Especialidad: Equipos médicos, ventas, soporte técnico

INSTRUCCIONES:
1. Responde de forma BREVE (2-4 líneas máximo)
2. USA la información de stock REAL proporcionada arriba
3. Si mencionan equipo que NO está en la lista → indica que no lo tenemos pero podemos verificar importación
4. Termina con pregunta abierta
5. Usa 1-2 emojis técnicos (🔧⚙️💡📊)

IMPORTANTE:
- NO inventes información de productos
- NO hables de equipos que no están en la lista de stock
- Sé conciso y directo`;
    // Construir mensajes para OpenAI
    const messages = [
      { role: 'system', content: technicalSystemPrompt }
    ];

    // Agregar historial reciente
    const recentHistory = conversationHistory.slice(-6);
    recentHistory.forEach(msg => {
      messages.push({ role: msg.role, content: msg.content });
    });

    // Llamar a OpenAI
    const client = getOpenAIClient();
    
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 200
    });

    const responseText = completion.choices[0].message.content;

    console.log(`✅ [TechnicalAI] Respuesta generada: ${responseText.substring(0, 80)}...`);

    // Determinar acciones sugeridas
    const suggestedActions = [];
    if (responseText.toLowerCase().includes('técnico') || responseText.toLowerCase().includes('ingeniero')) {
      suggestedActions.push('transfer_engineer');
    } else {
      suggestedActions.push('continue_conversation');
    }

    return {
      responseText,
      suggestedActions,
      meta: {
        classification: classification.subtype,
        confidence: classification.confidence,
        productsAvailable: availableEquipment.length,
        tokensUsed: completion.usage?.total_tokens || 0
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
