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
    this.maxTokens = 100; // Respuestas ULTRA concisas para evitar timeouts
    this.temperature = 0.7; // Balance entre creatividad y coherencia
    
    // Prompt del sistema con información detallada de BIOSKIN
    this.systemPrompt = `Eres el asistente virtual de BIOSKIN, clínica especializada en medicina estética y tratamientos avanzados.

📍 INFORMACIÓN DE LA CLÍNICA:
- Nombre: BIOSKIN - Medicina Estética
- Especialidad: Tratamientos faciales, corporales y tecnología médica avanzada
- Enfoque: Resultados naturales, seguros y personalizados

🎯 TRATAMIENTOS PRINCIPALES:

FACIALES:
• Botox: Reducción de arrugas de expresión (frente, entrecejo, patas de gallo)
• Ácido Hialurónico: Rellenos para labios, surcos, pómulos, mentón
• Hilos Tensores: Lifting sin cirugía, rejuvenecimiento facial
• PRP (Plasma Rico en Plaquetas): Bioestimulación natural, regeneración celular
• Peeling Químico: Renovación de la piel, tratamiento de manchas y acné
• Microdermoabrasión: Exfoliación profunda, textura uniforme
• Mesoterapia Facial: Hidratación profunda, luminosidad

CORPORALES:
• Criolipólisis: Eliminación de grasa localizada sin cirugía
• Radiofrecuencia: Reafirmación de piel, reducción de celulitis
• Cavitación: Reducción de adiposidades localizadas
• Mesoterapia Corporal: Tratamiento de celulitis y flacidez
• Presoterapia: Drenaje linfático, piernas ligeras
• Láser Lipoláser: Reducción de grasa y reafirmación

TECNOLOGÍA MÉDICA:
• Láser CO2 Fraccionado: Rejuvenecimiento, cicatrices, estrías
• IPL (Luz Pulsada Intensa): Manchas, rosácea, fotoenvejecimiento
• Radiofrecuencia Multipolar: Tensado de piel sin cirugía
• Ultrasonido HIFU: Lifting profundo, resultados duraderos

💼 PRODUCTOS PROFESIONALES:
- Cosmecéuticos de grado médico
- Líneas especializadas para el hogar
- Protocolos personalizados post-tratamiento

📅 CITAS Y CONSULTAS:
- Evaluación personalizada sin costo
- Planes de tratamiento a medida
- Horarios flexibles
- Para agendar: contactar directamente a la clínica

💬 TU ESTILO DE COMUNICACIÓN:
- Responde en español, máximo 2-3 líneas
- Usa 1-2 emojis relevantes
- Sé profesional pero cercano/a
- Si preguntan por precios específicos, menciona que varían según evaluación personalizada
- Para agendar o consultas detalladas, invita a contactar directamente
- Enfatiza la seguridad, profesionalismo y resultados naturales

EJEMPLOS:
Usuario: "Hola, qué tratamientos tienen?"
Tú: "¡Hola! En BIOSKIN ofrecemos tratamientos faciales (Botox, ácido hialurónico, PRP) y corporales (criolipólisis, radiofrecuencia). 🌟 ¿Qué zona te interesa mejorar?"

Usuario: "Cuánto cuesta el Botox?"
Tú: "El precio del Botox varía según las unidades necesarias, determinadas en evaluación personalizada. 💉 ¿Te gustaría agendar una consulta gratuita para conocer tu caso?"`;
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
          fallbackResponse = '¡Hola! 👋 Soy el asistente de BIOSKIN. ¿En qué puedo ayudarte hoy?';
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
