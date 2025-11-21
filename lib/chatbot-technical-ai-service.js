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
  searchProducts, 
  getProductByModel, 
  checkStock,
  formatProductInfo,
  formatSpecifications,
  generateCatalogSummary 
} from './technical-products-service.js';

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
 * Genera respuesta técnica usando IA con contexto de productos
 * 
 * @param {Object} classification - Resultado de classifyTechnical
 * @param {Array} conversationHistory - Historial de conversación
 * @returns {Promise<Object>} { responseText, suggestedActions, meta }
 */
export async function generateTechnicalReply(classification, conversationHistory = []) {
  console.log(`🤖 [TechnicalAI] Generando respuesta para ${classification.subtype}`);
  
  try {
    // 1. Buscar información de productos mencionados
    let productInfo = [];
    
    if (classification.entities.productNames.length > 0) {
      for (const productName of classification.entities.productNames) {
        const results = searchProducts(productName);
        if (results.length > 0) {
          productInfo.push(results[0]); // Mejor coincidencia
        }
      }
    }

    // Si no encontró productos por nombre, intentar búsqueda general en el mensaje
    if (productInfo.length === 0 && classification.kind === 'technical') {
      const lastUserMsg = conversationHistory.filter(m => m.role === 'user').pop();
      if (lastUserMsg) {
        const results = searchProducts(lastUserMsg.content);
        if (results.length > 0) {
          productInfo = results.slice(0, 2); // Top 2
        }
      }
    }

    console.log(`📦 [TechnicalAI] Productos encontrados: ${productInfo.length}`);

    // 2. Obtener información de stock si aplica
    let stockInfo = [];
    if (classification.subtype === 'sales' && productInfo.length > 0) {
      for (const product of productInfo) {
        const stock = checkStock(product.id);
        stockInfo.push(stock);
      }
    }

    // 3. Construir contexto estructurado para la IA
    let contextForAI = `INFORMACIÓN DE PRODUCTOS RELEVANTES:\n\n`;
    
    if (productInfo.length > 0) {
      productInfo.forEach((product, idx) => {
        contextForAI += `Producto ${idx + 1}:\n`;
        contextForAI += formatProductInfo(product, true);
        contextForAI += `\n`;
        
        if (classification.subtype === 'specs') {
          contextForAI += formatSpecifications(product);
          contextForAI += `\n`;
        }
      });
    } else {
      contextForAI += `No se encontraron productos específicos mencionados.\n`;
      contextForAI += `\nCATÁLOGO GENERAL DISPONIBLE:\n`;
      contextForAI += generateCatalogSummary();
    }

    // 4. Construir system prompt específico para rol técnico
    const technicalSystemPrompt = `Eres el asistente técnico de BIOSKIN, especializado en equipos médicos estéticos.

🎯 TU ROL:
- Nombre: Ing. Rafael Larrea (o delegado técnico)
- Especialidad: Equipos médicos estéticos, ventas, soporte técnico
- Trato: Formal, profesional, use "usted"
- Estilo: Claro, conciso, técnico pero comprensible

⚠️ LÍMITES DE SEGURIDAD CRÍTICOS:
- NUNCA dar instrucciones peligrosas (abrir fuentes de poder, manipular láseres sin protección, desarmar componentes de alta tensión)
- Si el problema requiere manipulación interna → recomendar visita técnica
- Si detecta riesgo eléctrico o de seguridad → ESCALAR inmediatamente
- No pedir al usuario ejecutar acciones que requieren EPP especializado

📋 CLASIFICACIÓN ACTUAL:
Tipo: ${classification.subtype}
Pregunta: ${classification.question}
Confianza: ${classification.confidence}

${contextForAI}

🔧 INSTRUCCIONES SEGÚN TIPO:

${classification.subtype === 'support' ? `
SOPORTE TÉCNICO (troubleshooting):
1. Haga 2-4 preguntas diagnósticas breves y priorizadas
2. Sugiera verificaciones SEGURAS (luces indicadoras, conexiones, sonidos)
3. Si requiere apertura de equipo → recomendar técnico especializado
4. Registre pasos intentados para transferencia futura
5. Ofrezca agendar visita técnica si no se resuelve
` : ''}

${classification.subtype === 'sales' ? `
VENTAS Y COTIZACIONES:
1. Presente 1-3 productos relevantes con precio y disponibilidad
2. Mencione características clave según necesidad del cliente
3. Si pregunta por stock → USE LA INFO DE STOCK PROPORCIONADA
4. Si no hay stock → indique tiempo de entrega estimado (consultar con proveedor)
5. Ofrezca opciones: cotización por correo, llamada, visita de demostración
6. NO presione ventas, brinde información clara
` : ''}

${classification.subtype === 'specs' ? `
ESPECIFICACIONES TÉCNICAS:
1. Presente specs relevantes de forma clara
2. Use bullets y organización visual
3. Destaque ventajas competitivas
4. Ofrezca manual técnico completo si lo solicita
5. Sugiera demostración presencial si muestra interés
` : ''}

${classification.subtype === 'installation' ? `
INSTALACIÓN Y CONFIGURACIÓN:
1. Confirme que tiene el equipo físicamente
2. Ofrezca manual de instalación (PDF o enlace)
3. Pregunte si desea capacitación presencial incluida
4. Si es instalación compleja → recomendar técnico certificado
5. No dar pasos peligrosos por chat
` : ''}

${classification.subtype === 'warranty' ? `
GARANTÍA Y REPARACIONES:
1. Pregunte cuándo se compró el equipo
2. Verifique si está en garantía (típicamente 6-12 meses)
3. Si en garantía → gestionar reparación sin costo
4. Si fuera de garantía → cotizar reparación
5. Ofrezca agendar visita técnica diagnóstica
` : ''}

💬 FORMATO DE RESPUESTA:
- Sea conciso (máximo 4-5 líneas de texto)
- Use bullets para opciones múltiples
- Incluya 1-2 emojis técnicos apropiados (🔧⚙️🛠️📊💻)
- Termine con pregunta o acción clara

⚠️ SI NO TIENE INFORMACIÓN:
"No tengo acceso a esa información específica en este momento. ¿Desea que le conecte con el Ing. Rafael directamente o le envíe el catálogo completo?"

📞 ESCALAMIENTO:
Si debe transferir al ingeniero o crear ticket, incluya en su respuesta:
"Voy a conectarle con el Ing. Rafael para una evaluación más detallada."`;

    // 5. Construir mensajes para OpenAI
    const messages = [
      { role: 'system', content: technicalSystemPrompt }
    ];

    // Agregar historial reciente
    const recentHistory = conversationHistory.slice(-6);
    recentHistory.forEach(msg => {
      messages.push({ role: msg.role, content: msg.content });
    });

    // 6. Llamar a OpenAI
    const client = getOpenAIClient();
    
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 250
    });

    const responseText = completion.choices[0].message.content;

    console.log(`✅ [TechnicalAI] Respuesta generada: ${responseText.substring(0, 80)}...`);

    // 7. Determinar acciones sugeridas basado en clasificación y respuesta
    const suggestedActions = determineSuggestedActions(
      classification,
      responseText,
      productInfo
    );

    // 8. Preparar meta información
    const meta = {
      classification: classification.subtype,
      confidence: classification.confidence,
      productsFound: productInfo.length,
      productIds: productInfo.map(p => p.id),
      stockChecked: stockInfo.length > 0,
      tokensUsed: completion.usage?.total_tokens || 0
    };

    return {
      responseText,
      suggestedActions,
      meta
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
 * Determina acciones sugeridas basado en clasificación y respuesta generada
 */
function determineSuggestedActions(classification, responseText, productInfo) {
  const actions = [];
  const lowerResponse = responseText.toLowerCase();

  // Acciones por tipo de clasificación
  switch (classification.subtype) {
    case 'support':
      if (lowerResponse.includes('técnico') || lowerResponse.includes('visita') || lowerResponse.includes('especializado')) {
        actions.push('transfer_engineer', 'schedule_visit');
      } else {
        actions.push('troubleshoot');
      }
      if (lowerResponse.includes('manual')) {
        actions.push('send_manual');
      }
      break;

    case 'sales':
      actions.push('provide_quote');
      if (productInfo.length > 0) {
        actions.push('show_product_details');
      }
      if (lowerResponse.includes('demostración') || lowerResponse.includes('visita')) {
        actions.push('schedule_visit');
      }
      break;

    case 'specs':
      actions.push('send_manual', 'show_product_details');
      if (lowerResponse.includes('demostración')) {
        actions.push('schedule_visit');
      }
      break;

    case 'installation':
      actions.push('send_manual');
      if (lowerResponse.includes('técnico') || lowerResponse.includes('capacitación')) {
        actions.push('schedule_visit', 'transfer_engineer');
      }
      break;

    case 'warranty':
      actions.push('create_ticket');
      if (lowerResponse.includes('visita') || lowerResponse.includes('reparación')) {
        actions.push('schedule_visit');
      }
      break;

    default:
      actions.push('transfer_engineer');
  }

  // Si menciona contacto directo
  if (lowerResponse.includes('conecte') || lowerResponse.includes('ingeniero') || lowerResponse.includes('rafael')) {
    if (!actions.includes('transfer_engineer')) {
      actions.push('transfer_engineer');
    }
  }

  console.log(`🎯 [TechnicalAI] Acciones sugeridas: ${actions.join(', ')}`);
  
  return actions;
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
