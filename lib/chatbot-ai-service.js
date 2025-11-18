import OpenAI from 'openai';
import { promotionsService } from './promotions-service.js';
import { 
  APPOINTMENT_LINK, 
  BUSINESS_HOURS,
  parseNaturalDate,
  parseNaturalTime 
} from './chatbot-appointment-service.js';
import { 
  generateCatalogText, 
  getTreatmentKeywords,
  findTreatmentByKeyword 
} from './treatments-data.js';

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
    
    // Prompt del sistema - PROFESIONAL Y FORMAL
    this.systemPrompt = `Usted es Salomé de BIOSKIN, asistente profesional de la clínica BIOSKIN Salud & Estética. Mantenga siempre un trato formal y respetuoso.

🎯 SU IDENTIDAD:
- Nombre: Salomé de BIOSKIN (NUNCA diga "soy un asistente" o "soy el asistente")
- Rol: Coordinadora de atención al cliente de BIOSKIN
- Preséntese como: "Soy Salomé de BIOSKIN" o "Salomé, de BIOSKIN Salud & Estética"
- Usted es cordial, profesional y formal en todo momento
- Utiliza SIEMPRE tratamiento de "usted": "¿Cómo está?", "¿En qué puedo asistirle?"
- Responde de forma breve (2-3 líneas máximo), sin listas largas
- Usa emojis con moderación y profesionalismo (1-2 máximo)
- NO use plantillas ni formatos rígidos
- Pregunte cuando no entienda algo
- Mantenga un tono amable pero siempre formal

📍 INFORMACIÓN DE LA CLÍNICA:
- Nombre: BIOSKIN Salud & Estética
- Horario: Lunes a viernes 09:00-19:00, sábados con cita previa
- Contacto: +593969890689, salud.bioskin@gmail.com
- Médico: Dra. Daniela Creamer
- Ingeniero: Ing. Rafael Larrea (equipos)
- Website: https://saludbioskin.vercel.app/#/products

⚠️ IMPORTANTE: Siempre use "usted" y conjugaciones formales (está, desea, necesita, puede, prefiere).

${generateCatalogText()}

💬 CÓMO RESPONDER:

⚠️ LÍMITES IMPORTANTES:
   - NO brinde diagnósticos médicos ni evaluaciones de condiciones específicas
   - Proporcione información GENERAL sobre tratamientos (precio, duración, beneficios básicos)
   - Si detecta INTERÉS REAL (preguntas específicas sobre su caso): Sugiera agendar cita o hablar con la Dra.
   - NO resuelva casos complejos por chat - la evaluación personalizada es presencial
   - Si pregunta "¿Este tratamiento es para mí?": Ofrezca consulta de evaluación ($10)

🔹 Precios y promociones:
   - Si HAY promoción activa: Menciónala con entusiasmo primero
   - Si NO hay promoción: Da el precio y ofrece opciones de pago si preguntan
   - Siempre incluye duración aproximada

📅 Agendar citas:
   - Link directo: ${APPOINTMENT_LINK}
   - Si solicitan su ayuda: Pregunte fecha/hora y diga "Permítame un momento, verifico la agenda..."
   - El sistema verificará automáticamente la disponibilidad en Google Calendar
   - Responda profesionalmente con los resultados (disponible/ocupado/alternativas)

🔹 Derivación a la Dra. (CUANDO SE DETECTE INTERÉS):
   - Si pregunta sobre su caso específico o muestra interés en un tratamiento
   - Sugiera: "Para una evaluación personalizada, le recomiendo hablar directamente con la Dra. Daniela"
   - Ofrezca: "¿Desea que le conecte con la Dra. Daniela por WhatsApp?"
   - Si acepta: Use la función TRANSFER_TO_DOCTOR (el sistema generará el link automáticamente)
   
🔹 Consultas técnicas:
   - Si es sobre equipos: Envíe link de productos y derive a Ing. Rafael

🔹 Horarios:
   - Lun-Vie: 09:00-19:00 (almuerzo 13:00-14:00)
   - Sábados: Con cita previa
   - Domingos: No se atiende

✨ EJEMPLOS DE COMUNICACIÓN PROFESIONAL:

Usuario: "Hola"
Usted: "Buenos días, soy Salomé de BIOSKIN Salud & Estética 😊 ¿En qué puedo asistirle?"

Usuario: "Cuánto cuesta la limpieza facial?"
Usted (con promo): "Actualmente contamos con una promoción: 2 limpiezas faciales por $40 (precio regular $25 cada una). Cada sesión dura 90 minutos. ¿Le interesa conocer más detalles?"
Usted (sin promo): "La limpieza facial profunda tiene un costo de $25 y una duración de 90 minutos. ¿Desea que le brinde más información al respecto?"

Usuario: "Tengo manchas en la cara, ¿qué me recomiendas?"
Usted: "Para manchas tenemos el tratamiento despigmentante ($30) y rejuvenecimiento IPL ($25). Sin embargo, para determinar el tratamiento ideal para su caso específico, le recomiendo una consulta de evaluación con la Dra. Daniela ($10). ¿Desea que le conecte con ella por WhatsApp?"

Usuario: "Sí, conéctame con la doctora"
Usted: [TRANSFER_TO_DOCTOR] (El sistema genera el link automáticamente con resumen)

Usuario: "Quiero agendar"
Usted: "Con gusto le asisto. Puede agendar directamente aquí: ${APPOINTMENT_LINK} o si prefiere, puedo ayudarle a encontrar un horario conveniente. ¿Qué prefiere?"

Usuario: "Ayúdame tú"
Usted: "Por supuesto. ¿Qué día le vendría bien? Puede indicarme, por ejemplo, 'mañana a las 3pm' o 'el viernes por la mañana'"

Usuario: "Viernes 3pm"
Usted: "Permítame un momento mientras verifico la disponibilidad del viernes a las 3pm..."
[Sistema verifica automáticamente y usted responde según el resultado]

Usuario: "Tienes después de las 5?"
Usted: "Por supuesto, permítame revisar los horarios disponibles después de las 5pm..."
[Sistema busca y usted responde profesionalmente]

⚠️ IMPORTANTE: Mantenga siempre el tratamiento de "usted". Responda profesionalmente adaptándose a cada conversación.`;
  }

  /**
   * Genera una respuesta basada en el historial de conversación
   * @param {string} userMessage - Mensaje del usuario
   * @param {Array} conversationHistory - Historial de la conversación
   * @param {Object} calendarTools - Herramientas de Calendar (opcional)
   */
  async generateResponse(userMessage, conversationHistory = [], calendarTools = null) {
    try {
      console.log('🔍 [AI] Iniciando generación de respuesta...');
      console.log(`🔍 [AI] OPENAI_API_KEY presente: ${!!process.env.OPENAI_API_KEY}`);
      console.log(`🔍 [AI] Calendar tools disponibles: ${!!calendarTools}`);
      
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

      // 📅 SI HAY HERRAMIENTAS DE CALENDAR: Verificar si necesita consultar
      let calendarInfo = null;
      if (calendarTools) {
        console.log('📅 [AI] Analizando si necesita consultar Calendar...');
        
        // Detectar fecha/hora en el mensaje
        const appointmentData = this.extractAppointmentData(userMessage);
        const timePreference = this.detectTimePreference(userMessage);
        
        // Si hay fecha y hora específica, verificar disponibilidad automáticamente
        if (appointmentData?.date && appointmentData?.time) {
          console.log(`🔍 [AI] Consultando disponibilidad: ${appointmentData.date} a las ${appointmentData.time}`);
          
          try {
            const availability = await calendarTools.checkAvailability(appointmentData.date, appointmentData.time);
            calendarInfo = {
              type: 'availability_check',
              requested: `${appointmentData.date} a las ${appointmentData.time}`,
              available: availability.available,
              message: availability.message
            };
            
            // Si está ocupado, buscar alternativas
            if (!availability.available) {
              const alternatives = await calendarTools.getAvailableHours(appointmentData.date);
              calendarInfo.alternatives = alternatives.available?.slice(0, 3) || [];
              calendarInfo.alternativesDate = alternatives.dateFormatted;
            }
            
            console.log('✅ [AI] Calendar consultado:', calendarInfo);
          } catch (error) {
            console.error('❌ [AI] Error consultando Calendar:', error);
            calendarInfo = { error: 'No pude consultar la agenda' };
          }
        }
        // Si pregunta por preferencia de tiempo (mañana/tarde/noche/fin de semana)
        else if (timePreference && /(horario|disponibilidad|cu[aá]ndo|d[ií]a)/i.test(userMessage)) {
          console.log(`🔍 [AI] Buscando horarios con preferencia: ${timePreference.value}`);
          
          try {
            const preferences = {
              preferredTime: timePreference.value,
              daysAhead: 7,
              isWeekend: timePreference.value === 'weekend'
            };
            
            const suggestions = await calendarTools.suggestAvailableHours(preferences);
            calendarInfo = {
              type: 'time_suggestions',
              preference: timePreference.value,
              suggestions: suggestions.suggestions.slice(0, 3).map(sugg => ({
                day: sugg.dayName,
                date: sugg.dateFormatted,
                hours: sugg.availableHours.slice(0, 4)
              }))
            };
            
            console.log('✅ [AI] Sugerencias encontradas:', calendarInfo);
          } catch (error) {
            console.error('❌ [AI] Error buscando sugerencias:', error);
            calendarInfo = { error: 'No pude buscar horarios' };
          }
        }
        
        // Agregar información de Calendar al contexto si se obtuvo
        if (calendarInfo) {
          const calendarContext = `
🗓️ RESULTADO DE CONSULTA AL CALENDARIO GOOGLE:

${calendarInfo.type === 'availability_check' 
  ? `Fecha/hora solicitada: ${calendarInfo.requested}
Estado: ${calendarInfo.available ? '✅ DISPONIBLE' : '❌ OCUPADO'}
${calendarInfo.available ? '' : `
Horarios alternativos el ${calendarInfo.alternativesDate}:
${calendarInfo.alternatives.map(h => `  • ${h}`).join('\n')}
`}`
  : calendarInfo.type === 'time_suggestions'
  ? `Preferencia: ${calendarInfo.preference}
Opciones disponibles:
${calendarInfo.suggestions.map(s => `  • ${s.day} ${s.date}: ${s.hours.join(', ')}`).join('\n')}`
  : calendarInfo.error || 'Sin resultados'
}

IMPORTANTE: Responde naturalmente basándote en esta información. NO copies estos textos exactos.
`;
          
          messages.push({
            role: 'system',
            content: calendarContext
          });
          
          console.log('✅ [AI] Contexto de Calendar agregado al prompt');
        }
      }

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
          fallbackResponse = 'Buenos días. Soy Salomé de BIOSKIN Salud & Estética 👋 ¿En qué puedo asistirle?';
          break;
        case 'appointment':
          fallbackResponse = 'Con gusto le asisto con el agendamiento de su cita 📅 Por favor contáctenos al WhatsApp de la clínica para coordinar su visita.';
          break;
        case 'info':
          fallbackResponse = 'Ofrecemos tratamientos faciales y corporales de medicina estética ✨ ¿Sobre qué tratamiento desea información?';
          break;
        case 'farewell':
          fallbackResponse = 'Que tenga un excelente día. Estamos a su disposición cuando lo necesite 👋';
          break;
        default:
          fallbackResponse = 'Gracias por su mensaje. Un asesor se pondrá en contacto con usted a la brevedad para brindarle la información necesaria 😊';
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
      transfer_doctor: /(hablar con|contactar|derivar|doctor|doctora|especialista|quiero hablar)/i,
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
    
    // Detectar tratamiento mencionado usando catálogo centralizado
    const foundTreatment = findTreatmentByKeyword(message);
    if (foundTreatment) {
      data.service = foundTreatment.name;
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
   * Genera link de WhatsApp para transferir a la Dra. Daniela con resumen
   * @param {Array} conversationHistory - Últimos mensajes de la conversación
   * @returns {string} - Link de WhatsApp con mensaje predefinido
   */
  generateDoctorWhatsAppLink(conversationHistory = []) {
    const DRA_PHONE = '593969890689'; // Número de la Dra. Daniela
    
    // Extraer los últimos 6 mensajes (3 intercambios)
    const recentMessages = conversationHistory.slice(-6);
    
    // Generar resumen de 3 líneas
    let summary = 'Nueva consulta desde chatbot:\\n\\n';
    
    // Detectar tema principal
    const allText = recentMessages.map(m => m.content).join(' ').toLowerCase();
    let topic = 'consulta general';
    
    if (allText.includes('mancha') || allText.includes('pigment')) {
      topic = 'tratamiento de manchas';
    } else if (allText.includes('acné') || allText.includes('acne')) {
      topic = 'tratamiento de acné';
    } else if (allText.includes('arruga') || allText.includes('envejec')) {
      topic = 'rejuvenecimiento facial';
    } else if (allText.includes('limpieza')) {
      topic = 'limpieza facial';
    } else if (allText.includes('hifu') || allText.includes('lifting')) {
      topic = 'HIFU / lifting';
    } else if (allText.includes('relleno') || allText.includes('labio')) {
      topic = 'rellenos faciales';
    } else if (allText.includes('láser') || allText.includes('laser')) {
      topic = 'tratamiento láser';
    }
    
    summary += `- Interesado en: ${topic}\\n`;
    
    // Agregar contexto si hay mensajes del usuario
    const userMessages = recentMessages.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      const lastUserMsg = userMessages[userMessages.length - 1].content;
      const preview = lastUserMsg.length > 60 ? lastUserMsg.substring(0, 60) + '...' : lastUserMsg;
      summary += `- Última consulta: "${preview}"\\n`;
    }
    
    summary += `- Solicita evaluación personalizada`;
    
    // Generar link de WhatsApp
    const encodedMessage = encodeURIComponent(summary);
    const whatsappLink = `https://wa.me/${DRA_PHONE}?text=${encodedMessage}`;
    
    console.log('📱 Link de WhatsApp generado para Dra. Daniela');
    
    return whatsappLink;
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
