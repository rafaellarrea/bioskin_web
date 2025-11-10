import OpenAI from 'openai';

// Inicializar cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Servicio de IA para el chatbot de WhatsApp
 * Genera respuestas contextuales usando OpenAI
 */
export class ChatbotAIService {
  constructor() {
    this.model = 'gpt-4o-mini'; // Modelo eficiente y económico
    this.maxTokens = 500; // Respuestas concisas
    this.temperature = 0.7; // Balance entre creatividad y coherencia
    
    // Prompt del sistema (personalizable)
    this.systemPrompt = `Eres un asistente virtual de BIOSKIN, una clínica de estética médica especializada en tratamientos faciales y corporales de última generación.

INFORMACIÓN DE LA CLÍNICA:
- Tratamientos: Rejuvenecimiento facial, tratamientos corporales, medicina estética
- Equipos: Tecnología de vanguardia en dispositivos médico-estéticos
- Servicios: Consultas, tratamientos personalizados, seguimiento post-tratamiento

TU PERSONALIDAD:
- Profesional pero cercana y amigable
- Enfocada en ayudar al cliente a encontrar el mejor tratamiento
- Respuestas claras, concisas y en español
- Usa emojis ocasionalmente para mayor calidez (máximo 2 por mensaje)

CAPACIDADES:
- Información sobre tratamientos y servicios
- Agendar citas (pedir nombre, teléfono y tratamiento de interés)
- Responder preguntas frecuentes sobre procedimientos
- Orientar sobre qué tratamiento es mejor según necesidades

IMPORTANTE:
- Si no sabes algo, sé honesto y ofrece contactar con el personal
- No diagnostiques ni des consejos médicos específicos
- Siempre ofrece agendar una consulta para casos personalizados
- Mantén respuestas cortas (máximo 3-4 líneas por WhatsApp)`;
  }

  /**
   * Genera una respuesta basada en el historial de conversación
   */
  async generateResponse(userMessage, conversationHistory = []) {
    try {
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

      // Llamar a OpenAI
      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

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
      console.error('❌ Error generando respuesta con OpenAI:', error);
      
      // Respuesta de fallback
      return {
        response: 'Lo siento, estoy teniendo dificultades técnicas en este momento. ¿Podrías intentar de nuevo en unos segundos? 🙏',
        tokensUsed: 0,
        error: error.message
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
