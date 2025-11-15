import OpenAI from 'openai';
import { promotionsService } from './promotions-service.js';
import { 
  APPOINTMENT_LINK, 
  BUSINESS_HOURS,
  parseNaturalDate,
  parseNaturalTime 
} from './chatbot-appointment-service.js';

// Cliente de OpenAI (inicialización lazy)
let openai = null;

function getOpenAIClient() {
  if (!openai) {
    console.log('🔧 [AI] Inicializando cliente OpenAI...');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 3000, // Timeout de 3s para requests
      maxRetries: 0, // Sin reintentos para respuestas rápidas
    });
    console.log('✅ [AI] Cliente OpenAI inicializado');
  }
  return openai;
}

/**
 * Servicio de IA para el chatbot de WhatsApp
 * Genera respuestas contextuales usando OpenAI
 */
export class ChatbotAIService {
  constructor() {
    this.model = 'gpt-4o-mini'; // Modelo eficiente y económico
    this.maxTokens = 150; // Aumentado para respuestas más completas basadas en dataset
    this.temperature = 0.7; // Balance entre creatividad y coherencia
    
    // Prompt del sistema MEJORADO con dataset de entrenamiento BIOSKIN
    this.systemPrompt = `Eres Matías, el asistente de BIOSKIN Salud & Estética.

IMPORTANTE: NO menciones que eres un "asistente virtual". Solo di que eres Matías, asistente de BIOSKIN.

📍 INFORMACIÓN DE LA CLÍNICA:
- Nombre: BIOSKIN Salud & Estética
- Horario: Lunes a viernes 09:00-19:00 (almuerzo 13:00-14:00), sábados/domingos con cita previa
- Contacto: +593969890689 (WhatsApp), salud.bioskin@gmail.com
- Médico: Dra. Daniela Creamer (cosmiatra y dermatocosmiatra)
- Ingeniero: Ing. Rafael Larrea (equipos y cotizaciones técnicas)
- Website productos: https://saludbioskin.vercel.app/#/products

🎯 CATÁLOGO COMPLETO DE TRATAMIENTOS (con precios exactos):

EVALUACIÓN Y DIAGNÓSTICO:
• Consulta + escáner facial: $10 USD - 30 min - Evaluación facial con escaneo

LIMPIEZA Y RENOVACIÓN:
• Limpieza facial profunda: $25 USD - 90 min - Higiene profunda, extracción, exfoliación
• Limpieza facial + crioradiofrecuencia: $30 USD - 90 min - Limpieza + tecnología

ESTIMULACIÓN Y REGENERACIÓN:
• Microneedling: $30 USD - 60 min - Estimulación colágeno, mejora textura y cicatrices
• Plasma rico en plaquetas (PRP): $30 USD - 45 min - Bioestimulación natural
• Bioestimuladores de colágeno: $250 USD - 45 min - Estimulación profunda colágeno
• Exosomas: $130 USD - 60 min - Tecnología avanzada regeneración

TECNOLOGÍA LÁSER:
• Láser CO2: $150 USD - 90 min - Rejuvenecimiento, cicatrices, estrías
• Rejuvenecimiento facial IPL: $25 USD - 60 min - Manchas, luminosidad
• Hollywood peel: $35 USD - 90 min - Tecnología avanzada regeneración
• Eliminación de tatuajes: desde $15 USD - 45-60 min - Precio según tamaño/color/antigüedad

TRATAMIENTOS AVANZADOS:
• HIFU full face: $60 USD - 120 min - Lifting sin cirugía, tensión facial
• Relleno de labios: $160 USD - 60 min - Ácido hialurónico, volumen y contorno
• Tratamiento despigmentante: $30 USD - 90 min - Manchas y pigmentación

🔧 REQUISITOS GENERALES POR TIPO:
- Láser/IPL: Evitar bronceado reciente, no embarazadas, informar medicamentos fotosensibilizantes
- Inyectables/PRP: Evitar AINEs 48h antes, no exposición solar intensa, informar anticoagulantes
- Limpiezas: No maquillaje, evitar exposición solar 48h, informar alergias

📋 TU PROTOCOLO DE ATENCIÓN:

1. SALUDO: "Hola, soy Matías de BIOSKIN Salud & Estética. ¿En qué puedo ayudarte hoy?"

2. CONSULTAS TRATAMIENTOS:
   - Dar nombre, precio, duración
   - Preguntar si desea más detalles
   - Si dice SÍ: explicar procedimiento, requisitos, beneficios
   - Ofrecer agendar evaluación con fecha específica

3. PRECIOS: 
   - PRIMERO verifica si hay PROMOCIONES activas en el contexto del sistema
   - Si hay promoción: Menciona PRIMERO la promoción con entusiasmo, LUEGO el precio regular
   - Ejemplo con promoción: "¡Tenemos una promoción! 🎉 Limpieza facial: 2x$40 USD (precio regular 1x$25 USD). ¡Ahorras $10!"
   - Si NO hay promoción: Mencionar precio regular y decir "Por el momento no contamos con descuentos en [tratamiento], pero puedo consultar opciones de pago si te interesa. ¿Te gustaría más información? 😊"
   - Siempre incluir duración del tratamiento
   - Si preguntan por descuentos y NO hay promoción activa: Responder con empatía ofreciendo alternativas

4. AGENDAR CITAS - SISTEMA AUTOMATIZADO:
   🔗 Link público: ${APPOINTMENT_LINK}
   
   Flujo de agendamiento:
   A. OFRECER OPCIONES:
      "Puedo ayudarte a agendar de dos formas:
      1️⃣ Agenda tú mismo en nuestro sistema: ${APPOINTMENT_LINK}
      2️⃣ Te ayudo aquí mismo por chat (te pido fecha, hora y verifico disponibilidad)
      ¿Cuál prefieres? 😊"
   
   B. SI ELIGE AGENDAR POR CHAT:
      - Pedir: nombre completo, teléfono, tratamiento deseado
      - Preguntar: "¿Qué día te gustaría? (ej: mañana, viernes, 20/11)"
      - Decir: "Dame un momento mientras verifico la agenda... 🔍"
      - ESPERA: Sistema verifica disponibilidad en Google Calendar
      - Si DISPONIBLE: "¡Perfecto! El [día] a las [hora] está disponible ✅ ¿Confirmo tu cita?"
      - Si OCUPADO: "Esa hora ya está ocupada ❌ Te sugiero: [mostrar 3 horarios cercanos]. ¿Alguno te sirve?"
      - Si CONFIRMA: Sistema agenda automáticamente y responde "✅ ¡Cita agendada! Te llegará confirmación por email. Te esperamos el [día] a las [hora] 😊"
      - Si RECHAZA: "Sin problema, ¿prefieres otro día u otra hora?"
   
   C. SUGERENCIAS INTELIGENTES:
      - Si pregunta "fines de semana": Sugerir sábados disponibles
      - Si pregunta "después de las 5pm": Filtrar solo 17:00-19:00
      - Si pregunta "próxima semana": Mostrar días Lunes-Viernes siguiente
      - Ejemplo: "Tengo disponibles estos sábados: [fecha1] a las 10am, [fecha2] a las 3pm. ¿Te sirve alguno?"
   
   ⏰ Horario de atención: ${BUSINESS_HOURS.start} a ${BUSINESS_HOURS.end} (Lun-Vie)
   🚫 No atendemos domingos
   📅 Duración: 2 horas por cita (mínimo)

5. DERIVACIÓN MÉDICO:
   - Si requiere diagnóstico o pregunta muy técnica: "Para este caso es necesario atención médica especializada. La Dra. Daniela Creamer se pondrá en contacto. ¿Desea que le enviemos mensaje al +593969890689?"

6. COTIZACIÓN EQUIPOS:
   - Enviar enlace: https://saludbioskin.vercel.app/#/products
   - Derivar con Ing. Rafael Larrea al +593969890689

💬 ESTILO DE COMUNICACIÓN:
- Tuteo amable "tú/te", tono cálido + profesional
- Responde en 2-3 líneas máximo
- Usa emojis relevantes (1-2 por mensaje)
- Sé específico con precios y duraciones
- Pregunta activamente para guiar al cliente
- Menciona requisitos si hay restricciones
- SIEMPRE preséntate como "Matías" o "Matías de BIOSKIN", NUNCA como "asistente virtual"
- Sé empático y abierto al diálogo sobre precios, descuentos y opciones

EJEMPLOS DEL DATASET:
Usuario: "Hola"
Tú: "Hola, soy Matías de BIOSKIN Salud & Estética. ¿En qué puedo ayudarte hoy? Puedo informarte sobre tratamientos, precios, agendar citas o enviarte nuestro catálogo. 🌟"

Usuario: "Quiero información sobre Microneedling"
Tú: "Microneedling: Estimulación de colágeno para mejorar textura y cicatrices. Precio: $30 USD, duración 60 min. ¿Deseas que te explique más en detalle o prefieres agendar una evaluación? 💉"

Usuario: "¿Cuánto cuesta la limpieza facial?"
Tú (CON PROMOCIÓN): "¡Tenemos una promoción especial! 🎉 Limpieza facial profunda: 2x$40 USD (precio regular 1x$25 USD). Ahorra $10 en tu segundo tratamiento. Duración: 90 min. ¿Te interesa aprovechar esta oferta?"
Tú (SIN PROMOCIÓN): "Limpieza facial profunda: $25 USD, duración 90 min. Por el momento no tenemos descuentos en este tratamiento, pero puedo consultar opciones de pago si te interesa. ¿Deseas agendar? 😊"

Usuario: "¿Cuánto cuesta el HIFU?"
Tú: "HIFU full face: $60 USD, duración 120 min. Lifting sin cirugía con tecnología avanzada. ¿Deseas agendar una evaluación para confirmar si es el tratamiento ideal para ti? ✨"

Usuario: "¿Es el precio final? ¿No hay descuento?"
Tú (SIN PROMOCIÓN): "Ese es el precio del tratamiento. Por el momento no contamos con descuentos en HIFU, pero puedo consultar opciones de pago o paquetes si te interesa. ¿Te gustaría más información? 😊"
Tú (CON PROMOCIÓN): "Actualmente tenemos una promoción en limpiezas faciales: 2x$40 USD. ¿Te interesa conocer más sobre esta oferta? 🎉"

Usuario: "Quiero agendar una cita"
Tú: "¡Perfecto! 😊 Puedo ayudarte de dos formas:
1️⃣ Agenda en línea: ${APPOINTMENT_LINK}
2️⃣ Te ayudo aquí mismo (verifico disponibilidad en tiempo real)
¿Cuál prefieres?"

Usuario: "Ayúdame aquí"
Tú: "¡Claro! Para agendarte necesito:
• Tu nombre completo
• Teléfono
• ¿Qué tratamiento deseas?
• ¿Qué día prefieres? (ej: mañana, viernes 20, próxima semana)"

Usuario: "Quiero el viernes a las 3pm"
Tú: "Perfecto, déjame verificar la disponibilidad del viernes a las 3pm... 🔍 [SISTEMA VERIFICA AUTOMÁTICAMENTE]"

Usuario: "Tienes algo disponible después de las 5pm?"
Tú: "Claro, déjame revisar los horarios después de las 5pm... 🔍 [SISTEMA FILTRA AUTOMÁTICAMENTE HORARIOS 17:00-19:00]"

Usuario: "Mejor el sábado"
Tú: "Los sábados también atendemos con cita previa. Déjame ver qué sábados tengo disponibles... 🔍 [SISTEMA BUSCA SÁBADOS DISPONIBLES]"`;
  }

  /**
   * Genera una respuesta basada en el historial de conversación
   */
  async generateResponse(userMessage, conversationHistory = []) {
    try {
      console.log('🔍 [AI] Iniciando generación de respuesta...');
      console.log(`🔍 [AI] OPENAI_API_KEY presente: ${!!process.env.OPENAI_API_KEY}`);
      
      // 🎯 VERIFICAR PROMOCIONES ACTIVAS antes de generar respuesta
      const promotionsSummary = promotionsService.getPromotionsSummary();
      console.log(`🎉 [AI] Promociones activas: ${promotionsSummary.hasPromotions ? promotionsSummary.count : 0}`);
      
      // Construir el array de mensajes para OpenAI
      const messages = [
        { role: 'system', content: this.systemPrompt }
      ];

      // 🎁 INYECTAR PROMOCIONES ACTIVAS en el contexto si existen
      if (promotionsSummary.hasPromotions) {
        const promotionsContext = `
🎉 PROMOCIONES ACTIVAS AHORA (${new Date().toLocaleDateString('es-ES')}):

${promotionsSummary.promotions.map(promo => `
• ${promo.name}
  Servicio: ${promo.service}
  Precio promoción: $${promo.promoPrice} USD (${promo.quantity} ${promo.type === 'package' ? 'sesiones' : 'unidades'})
  Precio regular: $${promo.originalPrice} USD
  Ahorro: ${promo.discount}% de descuento
  Válido hasta: ${promo.validUntil}
  Mensaje al cliente: "${promo.displayMessage}"
`).join('\n')}

⚠️ IMPORTANTE: SIEMPRE menciona la promoción si el cliente pregunta por estos servicios/productos.
Si pregunta por precios, PRIMERO menciona la promoción activa y LUEGO el precio regular.
`;
        
        messages.push({
          role: 'system',
          content: promotionsContext
        });
        
        console.log('✅ [AI] Promociones inyectadas en contexto del bot');
      }

      // Agregar historial (limitar a últimos 10 intercambios)
      const recentHistory = conversationHistory.slice(-20); // 10 pares user-assistant
      recentHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });

      // Agregar mensaje actual del usuario
      messages.push({
        role: 'user',
        content: userMessage
      });

      console.log(`🤖 Generando respuesta con ${messages.length} mensajes de contexto`);
      console.log(`🔍 [AI] Modelo: ${this.model}, maxTokens: ${this.maxTokens}`);

      // Llamar a OpenAI con timeout muy agresivo (3s total)
      console.log('🔍 [AI] Obteniendo cliente OpenAI...');
      const client = getOpenAIClient();
      
      console.log('🔍 [AI] Creando promesa de OpenAI...');
      const openaiPromise = client.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      }).then(result => {
        console.log('✅ [AI] OpenAI respondió correctamente');
        return result;
      }).catch(err => {
        console.error('❌ [AI] Error en request de OpenAI:', err.message);
        throw err;
      });
      
      console.log('🔍 [AI] Creando promesa de timeout (3.5s)...');
      const timeoutPromise = new Promise((_, reject) => {
        const timer = setTimeout(() => {
          console.log('⏰ [AI] ¡TIMEOUT alcanzado! (3.5s)');
          reject(new Error('TIMEOUT_3500MS'));
        }, 3500);
        // Limpiar timer si la promesa se resuelve
        openaiPromise.finally(() => clearTimeout(timer));
      });
      
      console.log('⏳ Esperando respuesta de OpenAI (timeout: 3.5s)...');
      const completion = await Promise.race([openaiPromise, timeoutPromise]);
      console.log('✅ OpenAI completó la respuesta');

      const response = completion.choices[0].message.content;
      const tokensUsed = completion.usage.total_tokens;

      console.log(`✅ Respuesta generada (${tokensUsed} tokens)`);

      return {
        response,
        tokensUsed,
        model: this.model,
        finishReason: completion.choices[0].finish_reason
      };
    } catch (error) {
      console.error('❌ Error generando respuesta con OpenAI:', error.message);
      console.error('❌ Stack trace:', error.stack);
      console.log('🔄 Activando sistema de fallback inteligente...');
      
      // Respuestas de fallback basadas en intención
      const intent = this.detectIntent(userMessage);
      let fallbackResponse;
      
      switch (intent) {
        case 'greeting':
          fallbackResponse = '¡Hola! 👋 Soy Matías de BIOSKIN. ¿En qué puedo ayudarte hoy?';
          break;
        case 'appointment':
          fallbackResponse = 'Me encantaría ayudarte a agendar una cita 📅 Por favor contáctanos al WhatsApp de la clínica para coordinar tu visita.';
          break;
        case 'info':
          fallbackResponse = 'Ofrecemos tratamientos faciales y corporales de medicina estética ✨ ¿Sobre qué tratamiento te gustaría saber más?';
          break;
        case 'farewell':
          fallbackResponse = '¡Hasta pronto! 👋 Estamos aquí cuando nos necesites.';
          break;
        default:
          fallbackResponse = 'Gracias por tu mensaje 😊 Un asesor te contactará pronto para brindarte la información que necesitas.';
      }
      
      console.log(`✅ Respuesta generada con fallback (${intent}): "${fallbackResponse.substring(0, 50)}..."`);
      
      return {
        response: fallbackResponse,
        tokensUsed: 0,
        error: error.message,
        fallback: true
      };
    }
  }

  /**
   * Actualiza el prompt del sistema (para personalizar el chatbot)
   */
  updateSystemPrompt(newPrompt) {
    this.systemPrompt = newPrompt;
    console.log('✅ Prompt del sistema actualizado');
  }

  /**
   * Configura parámetros del modelo
   */
  configure(config = {}) {
    if (config.model) this.model = config.model;
    if (config.maxTokens) this.maxTokens = config.maxTokens;
    if (config.temperature !== undefined) this.temperature = config.temperature;
    
    console.log('✅ Configuración del chatbot actualizada:', {
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature
    });
  }

  /**
   * Detecta intención del mensaje (para lógica condicional)
   */
  detectIntent(message) {
    const lowerMsg = message.toLowerCase();
    
    const intents = {
      greeting: /^(hola|buenos días|buenas tardes|hey|hi|saludos)/i,
      appointment: /(agendar|cita|reservar|turno|disponibilidad|horario)/i,
      appointment_confirmation: /(sí|si|confirmo|confirmar|ok|vale|dale|perfecto)/i,
      appointment_rejection: /(no|mejor no|cambiar|otra hora|otro día)/i,
      info: /(información|info|tratamiento|servicio|precio|costo|cuánto)/i,
      help: /(ayuda|help|no entiendo|qué puedes hacer)/i,
      farewell: /(adiós|chau|hasta luego|gracias|bye)/i,
    };

    for (const [intent, pattern] of Object.entries(intents)) {
      if (pattern.test(lowerMsg)) {
        return intent;
      }
    }

    return 'general';
  }

  /**
   * Extrae información de agendamiento del mensaje
   * Retorna objeto con fecha, hora, nombre, teléfono, servicio si los detecta
   */
  extractAppointmentData(message) {
    const data = {};
    
    // Intentar extraer fecha
    const date = parseNaturalDate(message);
    if (date) {
      data.date = date;
    }
    
    // Intentar extraer hora
    const time = parseNaturalTime(message);
    if (time) {
      data.time = time;
    }
    
    // Extraer nombre (si dice "mi nombre es X" o "soy X")
    const nameMatch = message.match(/(?:mi nombre es|me llamo|soy)\s+([a-záéíóúñ\s]+)/i);
    if (nameMatch) {
      data.name = nameMatch[1].trim();
    }
    
    // Extraer teléfono
    const phoneMatch = message.match(/(?:mi teléfono es|mi número es|mi celular es)?\s*(\+?\d[\d\s\-]{7,})/i);
    if (phoneMatch) {
      data.phone = phoneMatch[1].replace(/[\s\-]/g, '');
    }
    
    // Detectar tratamiento mencionado
    const treatments = [
      'limpieza facial', 'microneedling', 'prp', 'plasma', 'bioestimuladores',
      'exosomas', 'láser co2', 'laser', 'ipl', 'hollywood peel', 'hifu',
      'relleno', 'tratamiento despigmentante', 'consulta', 'evaluación'
    ];
    
    for (const treatment of treatments) {
      if (message.toLowerCase().includes(treatment)) {
        data.service = treatment;
        break;
      }
    }
    
    return Object.keys(data).length > 0 ? data : null;
  }

  /**
   * Verifica si un mensaje contiene una preferencia de horario
   */
  detectTimePreference(message) {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('mañana') && !lowerMsg.includes('pasado mañana')) {
      return { type: 'time', value: 'morning' };
    }
    if (lowerMsg.includes('tarde')) {
      return { type: 'time', value: 'afternoon' };
    }
    if (lowerMsg.includes('noche') || lowerMsg.includes('después de') || lowerMsg.includes('5pm') || lowerMsg.includes('6pm')) {
      return { type: 'time', value: 'evening' };
    }
    if (lowerMsg.includes('fin de semana') || lowerMsg.includes('sábado') || lowerMsg.includes('sabado')) {
      return { type: 'day', value: 'weekend' };
    }
    if (lowerMsg.includes('entre semana') || lowerMsg.includes('lunes') || lowerMsg.includes('martes') || 
        lowerMsg.includes('miércoles') || lowerMsg.includes('miercoles') || lowerMsg.includes('jueves') || lowerMsg.includes('viernes')) {
      return { type: 'day', value: 'weekday' };
    }
    
    return null;
  }

  /**
   * Valida que el API key de OpenAI esté configurado
   */
  static validateConfiguration() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no configurado en variables de entorno');
    }
    return true;
  }
}

// Instancia por defecto
export const chatbotAI = new ChatbotAIService();
