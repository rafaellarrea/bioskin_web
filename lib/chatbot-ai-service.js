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
    this.maxTokens = 150; // Respuestas MUY concisas para evitar timeouts
    this.temperature = 0.7; // Balance entre creatividad y coherencia
    
    // Prompt del sistema SIMPLIFICADO para respuestas rápidas
    this.systemPrompt = `Eres un asistente de BIOSKIN, clínica de medicina estética.

Responde en español, máximo 2-3 líneas.
Usa 1-2 emojis.
Sé amable y profesional.

Servicios: Tratamientos faciales y corporales, medicina estética.
Para agendar citas o info detallada, pide que contacten directamente.`;
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

      // Llamar a OpenAI con timeout muy agresivo (5s para Vercel Hobby cold start)
      const openaiPromise = openai.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI timeout después de 5s')), 5000)
      );
      
      console.log('⏳ Esperando respuesta de OpenAI (timeout: 5s)...');
      const completion = await Promise.race([openaiPromise, timeoutPromise]);
      console.log('✅ OpenAI respondió');

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
