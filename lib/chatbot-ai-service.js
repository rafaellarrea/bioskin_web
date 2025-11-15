import OpenAI from 'openai';

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
   - Siempre mencionar precio exacto en USD y duración
   - Si preguntan "¿Es el precio final?": Responder "Ese es el precio del tratamiento. Por el momento no contamos con descuentos o promociones activas en [nombre tratamiento], pero podemos coordinar opciones de pago o paquetes si te interesa. ¿Te gustaría más información? 😊"
   - Si preguntan por descuentos/promociones: "Actualmente no tenemos promociones en [nombre tratamiento/producto], pero puedo consultar si hay alguna opción especial disponible. ¿Te gustaría que la Dra. Creamer se comunique contigo para revisar alternativas? 📞"

4. AGENDAR CITAS:
   - Solicitar: nombre completo, teléfono, correo
   - Verificar disponibilidad en Google Calendar
   - Confirmar: "He creado la cita en Google Calendar. Le he enviado confirmación por correo y recordatorio 24h antes"

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

Usuario: "¿Cuánto cuesta el HIFU?"
Tú: "HIFU full face: $60 USD, duración 120 min. Lifting sin cirugía con tecnología avanzada. ¿Deseas agendar una evaluación para confirmar si es el tratamiento ideal para ti? ✨"

Usuario: "¿Es el precio final? ¿No hay descuento?"
Tú: "Ese es el precio del tratamiento. Por el momento no contamos con descuentos en HIFU, pero puedo consultar opciones de pago o paquetes si te interesa. ¿Te gustaría más información? 😊"`;
  }

  /**
   * Genera una respuesta basada en el historial de conversación
   */
  async generateResponse(userMessage, conversationHistory = []) {
    try {
      console.log('🔍 [AI] Iniciando generación de respuesta...');
      console.log(`🔍 [AI] OPENAI_API_KEY presente: ${!!process.env.OPENAI_API_KEY}`);
      
      // Construir el array de mensajes para OpenAI
      const messages = [
        { role: 'system', content: this.systemPrompt }
      ];

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
