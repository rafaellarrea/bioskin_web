import { 
  initChatbotDatabase, 
  upsertConversation, 
  saveMessage, 
  getConversationHistory,
  saveTrackingEvent,
  upsertTemplate,
  saveAppState,
  updateUserPreferences
} from '../lib/neon-chatbot-db-vercel.js';
import { cleanupService } from '../lib/chatbot-cleanup.js';
import { chatbotAI } from '../lib/chatbot-ai-service.js';
import { FallbackStorage } from '../lib/fallback-storage.js';
import {
  checkAvailability,
  getAvailableHours,
  createAppointment,
  suggestAvailableHours,
  APPOINTMENT_LINK
} from '../lib/chatbot-appointment-service.js';

// Flag para controlar si usar fallback
// Comenzar intentando Neon, caer a fallback si hay timeout
let useFallback = false; // ✅ Intentar Neon primero, fallback automático si falla

// Flag para DESACTIVAR OpenAI temporalmente (debug)
const DISABLE_OPENAI = false; // ✅ OpenAI ACTIVADO - Sistema funcionando correctamente

/**
 * Detección simple de intención sin IA
 */
function detectSimpleIntent(message) {
  const lowerMsg = message.toLowerCase();
  
  if (/^(hola|buenos días|buenas tardes|hey|hi|saludos)/i.test(lowerMsg)) {
    return 'greeting';
  }
  if (/(agendar|cita|reservar|turno|disponibilidad|horario)/i.test(lowerMsg)) {
    return 'appointment';
  }
  if (/(información|info|tratamiento|servicio|precio|costo|cuánto)/i.test(lowerMsg)) {
    return 'info';
  }
  return 'general';
}

/**
 * ENDPOINT PRINCIPAL DEL CHATBOT DE WHATSAPP
 * Maneja verificación del webhook y procesamiento de mensajes
 * 
 * Variables de entorno requeridas:
 * - NEON_DATABASE_URL o POSTGRES_URL: URL de conexión a PostgreSQL
 * - OPENAI_API_KEY: API key de OpenAI (ya configurada)
 * - WHATSAPP_VERIFY_TOKEN: Token para verificación del webhook
 * - WHATSAPP_ACCESS_TOKEN: Token de acceso de WhatsApp Business API
 * 
 * NOTA: Actualmente usando almacenamiento en memoria (fallback) debido a 
 * problemas de timeout con Neon PostgreSQL free tier (scale-to-zero).
 */

export default async function handler(req, res) {
  // ============================================
  // VERIFICACIÓN DEL WEBHOOK (GET)
  // ============================================
  if (req.method === 'GET') {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      console.log('🔐 Verificación de webhook:', { mode, token: token ? '***' : 'missing', challenge: challenge ? '***' : 'missing' });

      // Si no hay parámetros, mostrar página de información
      if (!mode && !token && !challenge) {
        return res.status(200).json({
          status: 'ok',
          message: 'WhatsApp Chatbot Webhook',
          info: 'Este endpoint está configurado para recibir webhooks de WhatsApp Business API',
          verification: {
            url: 'https://saludbioskin.vercel.app/api/whatsapp-chatbot',
            method: 'GET',
            requiredParams: ['hub.mode', 'hub.verify_token', 'hub.challenge']
          },
          environment: {
            hasVerifyToken: !!process.env.WHATSAPP_VERIFY_TOKEN,
            hasAccessToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
            hasPhoneNumberId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
            hasNeonDb: !!process.env.NEON_DATABASE_URL,
            hasOpenAI: !!process.env.OPENAI_API_KEY
          }
        });
      }

      // Verificar token
      if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('✅ Webhook verificado correctamente');
        return res.status(200).send(challenge);
      }

      console.log('❌ Verificación fallida - token incorrecto o parámetros faltantes');
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Token verification failed',
        received: {
          mode: mode || 'missing',
          hasToken: !!token,
          hasChallenge: !!challenge
        }
      });
    } catch (error) {
      console.error('❌ Error en verificación:', error);
      return res.status(500).json({ error: 'Error en verificación' });
    }
  }

  // ============================================
  // PROCESAMIENTO DE MENSAJES (POST)
  // ============================================
  if (req.method === 'POST') {
    try {
      console.log('🔵 Webhook POST recibido:', JSON.stringify(req.body, null, 2));
      
      // Procesar mensaje de forma síncrona pero rápida
      await processWhatsAppMessage(req.body);
      
      // Responder OK después de procesar
      return res.status(200).send('OK');

    } catch (error) {
      console.error('❌ Error en endpoint:', error);
      // Responder OK incluso si hay error para que WhatsApp no reintente
      return res.status(200).send('OK');
    }
  }

  // Método no permitido
  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * Procesa un mensaje entrante de WhatsApp
 */
async function processWhatsAppMessage(body) {
  try {
    console.log('📱 Procesando mensaje de WhatsApp...');

    // Extraer datos del webhook de WhatsApp
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    // Ignorar webhooks de estado (sent, delivered, read)
    if (!message && value?.statuses) {
      console.log('ℹ️ Webhook de estado ignorado:', value.statuses[0]?.status);
      return;
    }

    // ============================================
    // PROCESAMIENTO DE WEBHOOKS ADICIONALES
    // ============================================

    // 1. Message Echoes (sincronización con Business Manager)
    if (message?.is_echo === true) {
      console.log('🔄 Message echo detectado (mensaje desde Business Manager)');
      try {
        await saveTrackingEvent(
          `admin_${message.from}`,
          'message_echo',
          {
            messageId: message.id,
            from: message.from,
            text: message.text?.body,
            timestamp: message.timestamp
          }
        );
        console.log('✅ Echo registrado en tracking');
      } catch (error) {
        console.error('❌ Error procesando echo:', error);
      }
      return;
    }

    // 2. Tracking Events (análisis de interacciones)
    if (entry[0]?.changes?.[0]?.value?.tracking_data) {
      const trackingData = entry[0].changes[0].value.tracking_data;
      console.log('📊 Tracking event recibido:', trackingData.event_type);
      try {
        await saveTrackingEvent(
          trackingData.wa_id,
          trackingData.event_type,
          trackingData
        );
        console.log('✅ Tracking guardado');
      } catch (error) {
        console.error('❌ Error guardando tracking:', error);
      }
      return;
    }

    // 3. Template Updates (actualizaciones de plantillas de marketing)
    if (entry[0]?.changes?.[0]?.field === 'message_template_status_update') {
      const templateUpdate = entry[0].changes[0].value;
      console.log('📋 Template update:', templateUpdate.message_template_name);
      try {
        await upsertTemplate(
          templateUpdate.message_template_id,
          templateUpdate.category,
          templateUpdate.event,
          {
            name: templateUpdate.message_template_name,
            language: templateUpdate.message_template_language,
            reason: templateUpdate.reason,
            rejectionReason: templateUpdate.rejection_reason
          }
        );
        console.log('✅ Template actualizado');
      } catch (error) {
        console.error('❌ Error actualizando template:', error);
      }
      return;
    }

    // 4. App State Sync (estado online/offline)
    if (entry[0]?.changes?.[0]?.field === 'smb_app_state_sync') {
      const appState = entry[0].changes[0].value;
      console.log('🔄 App state sync:', appState.status);
      try {
        await saveAppState('whatsapp_status', {
          status: appState.status,
          phoneNumber: appState.phone_number,
          timestamp: new Date().toISOString()
        });
        console.log('✅ Estado de app guardado');
      } catch (error) {
        console.error('❌ Error guardando estado:', error);
      }
      return;
    }

    // 5. User Preferences (preferencias de comunicación)
    if (entry[0]?.changes?.[0]?.value?.preferences) {
      const prefs = entry[0].changes[0].value.preferences;
      const userId = entry[0].changes[0].value.wa_id;
      console.log('⚙️ Preferencias de usuario actualizadas');
      try {
        await updateUserPreferences(`whatsapp_${userId}`, {
          notificationsEnabled: prefs.notifications_enabled,
          language: prefs.language,
          marketingOptIn: prefs.marketing_opt_in,
          updatedAt: new Date().toISOString()
        });
        console.log('✅ Preferencias guardadas');
      } catch (error) {
        console.error('❌ Error guardando preferencias:', error);
      }
      return;
    }

    if (!message) {
      console.log('⚠️ No hay mensaje en el webhook');
      return;
    }

    // Información del mensaje
    const from = message.from; // Número de teléfono
    const messageId = message.id;
    const messageType = message.type;
    const timestamp = message.timestamp;

    // Solo procesar mensajes de texto por ahora
    if (messageType !== 'text') {
      console.log(`⚠️ Tipo de mensaje no soportado: ${messageType}`);
      await sendWhatsAppMessage(from, 'Lo siento, solo puedo procesar mensajes de texto por ahora. 📝');
      return;
    }

    const userMessage = message.text.body;
    console.log(`📨 Mensaje de ${from}: "${userMessage}"`);

    // Generar ID de sesión (número de teléfono como identificador)
    const sessionId = `whatsapp_${from}`;
    console.log(`🔑 Session ID generado: ${sessionId}`);

    // Wrapper para intentar operaciones con fallback
    const withFallback = async (operation, fallbackFn, description) => {
      if (useFallback) {
        console.log(`⚡ [FALLBACK ACTIVO] ${description}`);
        return fallbackFn();
      }
      
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000) // 2s timeout para Neon
        );
        return await Promise.race([operation(), timeoutPromise]);
      } catch (error) {
        console.warn(`⚠️ ${description} falló, activando fallback:`, error.message);
        useFallback = true; // Activar fallback para próximas operaciones
        return fallbackFn();
      }
    };

    // Crear/actualizar conversación (con fallback)
    console.log('💾 Paso 2: Creando/actualizando conversación...');
    await withFallback(
      () => upsertConversation(sessionId, from),
      () => FallbackStorage.saveConversation(sessionId, from),
      'Upsert conversación'
    );
    console.log('✅ Conversación actualizada');

    // Guardar mensaje del usuario (con fallback)
    console.log('💾 Paso 3: Guardando mensaje del usuario...');
    await withFallback(
      () => saveMessage(sessionId, 'user', userMessage, 0, messageId),
      () => FallbackStorage.saveMessage(sessionId, 'user', userMessage, 0, messageId),
      'Guardar mensaje usuario'
    );
    console.log('✅ Mensaje del usuario guardado');

    // Obtener historial de conversación (con fallback)
    console.log('💾 Paso 4: Obteniendo historial...');
    const history = await withFallback(
      () => getConversationHistory(sessionId, 20),
      () => FallbackStorage.getConversationHistory(sessionId, 20),
      'Obtener historial'
    );
    console.log(`✅ Historial obtenido: ${history.length} mensajes`);

    // ============================================
    // PASO 4.5: DETECTAR Y PROCESAR AGENDAMIENTO AUTOMÁTICO
    // ============================================
    console.log('📅 Paso 4.5: Verificando si requiere agendamiento...');
    
    // Detectar intención de agendamiento
    const intent = chatbotAI.detectIntent(userMessage);
    const appointmentData = chatbotAI.extractAppointmentData(userMessage);
    const timePreference = chatbotAI.detectTimePreference(userMessage);
    
    // Variable para forzar respuesta directa (sin OpenAI) en flujo de agendamiento
    let directResponse = null;
    
    // Buscar estado de agendamiento en preferencias de usuario (simulado con último mensaje del asistente)
    const lastAssistantMsg = history.filter(m => m.role === 'assistant').pop();
    const isInAppointmentFlow = lastAssistantMsg?.content?.includes('verifico disponibilidad') || 
                                 lastAssistantMsg?.content?.includes('está disponible') ||
                                 lastAssistantMsg?.content?.includes('Confirmo tu cita');
    
    console.log('📋 Análisis de agendamiento:', {
      intent,
      hasAppointmentData: !!appointmentData,
      hasTimePreference: !!timePreference,
      isInAppointmentFlow,
      data: appointmentData
    });
    
    // FLUJO 1: Usuario pregunta por disponibilidad o quiere agendar
    if ((intent === 'appointment' || appointmentData) && !isInAppointmentFlow) {
      console.log('🎯 Iniciando flujo de agendamiento...');
      
      // Si tiene fecha y hora en el mensaje
      if (appointmentData?.date && appointmentData?.time) {
        console.log(`🔍 Verificando disponibilidad: ${appointmentData.date} a las ${appointmentData.time}`);
        
        try {
          const availability = await checkAvailability(appointmentData.date, appointmentData.time);
          
          if (availability.available) {
            directResponse = `✅ ¡Perfecto! El ${availability.message.split('El ')[1]} está disponible.\n\n` +
                           `Para confirmar tu cita necesito:\n` +
                           `📝 Tu nombre completo\n` +
                           `📱 Tu teléfono\n` +
                           `💆 ¿Qué tratamiento deseas?\n\n` +
                           `¿Confirmo con esos datos?`;
          } else {
            // Sugerir horarios alternativos
            const suggestions = await getAvailableHours(appointmentData.date);
            const altHours = suggestions.available?.slice(0, 3).join(', ') || 'ninguno';
            
            directResponse = `❌ Lo siento, esa hora ya está ocupada.\n\n` +
                           `Horarios disponibles el ${suggestions.dateFormatted}:\n` +
                           `⏰ ${altHours}\n\n` +
                           `¿Te sirve alguno de estos?`;
          }
        } catch (error) {
          console.error('❌ Error verificando disponibilidad:', error);
          directResponse = `⚠️ Tuve un problema verificando la agenda. ¿Podrías intentar de nuevo o agendar directamente en: ${APPOINTMENT_LINK}?`;
        }
      }
      // Si tiene preferencia de tiempo (mañana/tarde/noche)
      else if (timePreference) {
        console.log(`💡 Detectada preferencia: ${timePreference.value}`);
        
        try {
          const preferences = {
            preferredTime: timePreference.value,
            daysAhead: 7,
            isWeekend: timePreference.value === 'weekend'
          };
          
          const suggestions = await suggestAvailableHours(preferences);
          
          if (suggestions.suggestions.length > 0) {
            let responseText = `📅 Encontré estas opciones para ti:\n\n`;
            
            suggestions.suggestions.forEach((sugg, idx) => {
              responseText += `${idx + 1}. ${sugg.dayName} ${sugg.dateFormatted}\n`;
              responseText += `   ⏰ ${sugg.availableHours.join(', ')}\n\n`;
            });
            
            responseText += `¿Cuál te sirve mejor?`;
            directResponse = responseText;
          } else {
            directResponse = `😔 No encontré horarios disponibles con esa preferencia.\n\n` +
                           `¿Te gustaría ver todas las opciones disponibles o prefieres agendar en: ${APPOINTMENT_LINK}?`;
          }
        } catch (error) {
          console.error('❌ Error sugiriendo horarios:', error);
          directResponse = `⚠️ Tuve un problema buscando horarios. Puedes agendar directamente en: ${APPOINTMENT_LINK}`;
        }
      }
      // Solo mencionó que quiere agendar
      else {
        directResponse = `¡Perfecto! 😊 Puedo ayudarte de dos formas:\n\n` +
                       `1️⃣ Agenda en línea: ${APPOINTMENT_LINK}\n` +
                       `2️⃣ Te ayudo aquí (verifico disponibilidad en tiempo real)\n\n` +
                       `¿Cuál prefieres?`;
      }
    }
    
    // FLUJO 2: Usuario confirma cita después de verificar disponibilidad
    else if (isInAppointmentFlow && (intent === 'appointment_confirmation' || userMessage.toLowerCase().includes('confirmo'))) {
      console.log('✅ Usuario confirma cita');
      
      // Extraer datos del último mensaje del asistente y del usuario
      if (appointmentData) {
        console.log('📝 Creando cita con datos:', appointmentData);
        
        try {
          // Necesitamos nombre, phone, service, date, hour
          const result = await createAppointment({
            name: appointmentData.name || 'Cliente WhatsApp',
            phone: from,
            service: appointmentData.service || 'Evaluación facial',
            date: appointmentData.date,
            hour: appointmentData.time
          });
          
          if (result.success) {
            directResponse = result.message;
          } else {
            directResponse = `❌ ${result.message}\n\n¿Prefieres agendar directamente en: ${APPOINTMENT_LINK}?`;
          }
        } catch (error) {
          console.error('❌ Error creando cita:', error);
          directResponse = `⚠️ Hubo un problema agendando tu cita. Por favor intenta en: ${APPOINTMENT_LINK}`;
        }
      } else {
        directResponse = `Para confirmar tu cita necesito:\n` +
                       `📝 Nombre completo\n` +
                       `📱 Teléfono\n` +
                       `💆 Tratamiento\n` +
                       `📅 Fecha y hora\n\n` +
                       `¿Podrías proporcionarme estos datos?`;
      }
    }
    
    // FLUJO 3: Usuario rechaza y quiere otra opción
    else if (isInAppointmentFlow && intent === 'appointment_rejection') {
      console.log('🔄 Usuario quiere cambiar fecha/hora');
      directResponse = `Sin problema 😊 ¿Qué día y hora prefieres?\n\n` +
                     `O si prefieres, agenda directamente en: ${APPOINTMENT_LINK}`;
    }

    // ============================================
    // PASO 5: PREPARAR HERRAMIENTAS DE CALENDAR PARA LA IA
    // ============================================
    const calendarTools = {
      checkAvailability,
      getAvailableHours,
      suggestAvailableHours,
      APPOINTMENT_LINK
    };

    // Generar respuesta con IA (con timeout global de 5s)
    console.log('🤖 Paso 5: Generando respuesta con IA...');
    console.log(`🔑 [AI] OPENAI_API_KEY configurado: ${!!process.env.OPENAI_API_KEY}`);
    let aiResult;
    
    // TEMPORAL: Usar solo fallback para debug
    if (DISABLE_OPENAI) {
      console.log('⚠️ [DEBUG] OpenAI desactivado, usando fallback directo');
      const intent = detectSimpleIntent(userMessage);
      let fallbackResponse;
      
      switch (intent) {
        case 'greeting':
          fallbackResponse = 'Buenos días, soy Salomé de BIOSKIN 😊 ¿En qué puedo asistirle?';
          break;
        case 'appointment':
          fallbackResponse = '¿Le gustaría ver todas las opciones disponibles o prefiere agendar en: https://saludbioskin.vercel.app/#/appointment?';
          break;
        case 'info':
          fallbackResponse = 'Contamos con diversos tratamientos de medicina estética ✨ ¿Sobre qué tratamiento desea información?';
          break;
        default:
          fallbackResponse = 'Gracias por su mensaje. ¿En qué puedo asistirle hoy?';
      }
      
      aiResult = {
        response: fallbackResponse,
        tokensUsed: 0,
        fallback: true,
        debug: true
      };
      
      console.log(`✅ Fallback DEBUG activado (${intent}): "${fallbackResponse.substring(0, 30)}..."`);
    } else {
      // Configurar timeout global ANTES de llamar a generateResponse
      let timeoutReached = false;
      const globalTimeoutId = setTimeout(() => {
        timeoutReached = true;
        console.log('⏰ [WEBHOOK] ¡TIMEOUT GLOBAL alcanzado! (5s)');
      }, 5000);
      
      try {
        console.log('🚀 [WEBHOOK] Iniciando generación de respuesta...');
        aiResult = await chatbotAI.generateResponse(userMessage, history, calendarTools);
        clearTimeout(globalTimeoutId); // Limpiar timeout si se resuelve
        
        if (timeoutReached) {
          console.log('⚠️ [WEBHOOK] Respuesta llegó DESPUÉS del timeout global');
          throw new Error('RESPONSE_AFTER_TIMEOUT');
        }
        
        console.log(`✅ Respuesta generada: "${aiResult.response.substring(0, 50)}..." (${aiResult.tokensUsed || 0} tokens)`);
        
        if (aiResult.error) {
          console.error('⚠️ Error en generación de respuesta:', aiResult.error);
        }
      } catch (error) {
        clearTimeout(globalTimeoutId);
        console.error('❌ Error CRÍTICO generando respuesta:', error.message);
        console.log('🔄 Usando fallback de emergencia...');
        
        // Fallback de emergencia con detección de intención
        const intent = detectSimpleIntent(userMessage);
        let fallbackResponse;
        
        switch (intent) {
          case 'greeting':
            fallbackResponse = 'Buenos días, soy Salomé de BIOSKIN 😊 ¿En qué puedo asistirle?';
            break;
          case 'appointment':
            fallbackResponse = '¿Le gustaría ver todas las opciones disponibles o prefiere agendar en: https://saludbioskin.vercel.app/#/appointment?';
            break;
          case 'info':
            fallbackResponse = 'Contamos con diversos tratamientos de medicina estética ✨ ¿Sobre qué tratamiento desea información?';
            break;
          default:
            fallbackResponse = 'Gracias por su mensaje. ¿En qué puedo asistirle hoy?';
        }
        
        aiResult = {
          response: fallbackResponse,
          tokensUsed: 0,
          error: error.message,
          fallback: true,
          emergency: true
        };
        
        console.log(`✅ Fallback de emergencia activado (${intent}): "${fallbackResponse.substring(0, 30)}..."`);
      }
    }

    // Guardar respuesta del asistente (con fallback)
    console.log('💾 Paso 6: Guardando respuesta del asistente...');
    
    // 🔍 DETECTAR SI SE DEBE TRANSFERIR A LA DOCTORA
    const shouldTransfer = chatbotAI.detectIntent(userMessage) === 'transfer_doctor' ||
                          aiResult.response?.includes('[TRANSFER_TO_DOCTOR]') ||
                          (userMessage.toLowerCase().includes('sí') && 
                           history.slice(-2).some(m => m.role === 'assistant' && 
                           m.content.toLowerCase().includes('conecte con la dra')));
    
    let finalResponse = aiResult.response;
    
    if (shouldTransfer) {
      console.log('📞 Transferencia a Dra. Daniela solicitada');
      
      // Generar link de WhatsApp con resumen
      const whatsappLink = chatbotAI.generateDoctorWhatsAppLink(history);
      
      // Reemplazar [TRANSFER_TO_DOCTOR] o agregar al final
      if (finalResponse.includes('[TRANSFER_TO_DOCTOR]')) {
        finalResponse = finalResponse.replace('[TRANSFER_TO_DOCTOR]', 
          `Perfecto. Aquí está el enlace para contactar directamente con la Dra. Daniela:\n\n${whatsappLink}\n\nElla le brindará una atención personalizada 😊`);
      } else {
        finalResponse += `\n\nPerfecto. Aquí está el enlace para contactar directamente con la Dra. Daniela:\n\n${whatsappLink}\n\nElla le brindará una atención personalizada 😊`;
      }
      
      console.log('✅ Link de WhatsApp generado y agregado a la respuesta');
    }
    
    await withFallback(
      () => saveMessage(sessionId, 'assistant', finalResponse, aiResult.tokensUsed),
      () => FallbackStorage.saveMessage(sessionId, 'assistant', finalResponse, aiResult.tokensUsed),
      'Guardar respuesta asistente'
    );
    console.log('✅ Respuesta del asistente guardada');

    // Enviar respuesta a WhatsApp (DEBE ser síncrono para que funcione en Vercel)
    console.log('📤 Paso 7: Enviando respuesta a WhatsApp...');
    try {
      await sendWhatsAppMessage(from, finalResponse);
      console.log('✅ Respuesta enviada a WhatsApp exitosamente');
    } catch (error) {
      console.error('❌ Error enviando a WhatsApp:', error.message);
      console.error('❌ Error type:', error.name);
      // No lanzar el error para que el proceso continúe
    }

    // Limpieza ligera ocasional (10% de probabilidad)
    if (Math.random() < 0.1) {
      console.log('🧹 Ejecutando limpieza ligera...');
      cleanupService.lightCleanup().catch(err => {
        console.log('⚠️ Error en limpieza ligera:', err);
      });
    }

    console.log('✅ Mensaje procesado exitosamente');
  } catch (error) {
    console.error('❌ Error en processWhatsAppMessage:', error);
    console.error('❌ Stack trace completo:', error.stack);
    
    // Intentar enviar mensaje de error al usuario (sin await)
    try {
      sendWhatsAppMessage(from, 'Disculpa, tuvimos un problema procesando tu mensaje. Por favor intenta de nuevo. 🙏').catch(() => {});
    } catch {}
    
    throw error;
  }
}

/**
 * Envía un mensaje a través de WhatsApp Business API
 */
async function sendWhatsAppMessage(to, text) {
  try {
    console.log(`📤 Intentando enviar mensaje a ${to}`);
    console.log(`📝 Texto: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
    
    const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    console.log(`🔑 Phone Number ID: ${phoneNumberId ? phoneNumberId.substring(0, 10) + '...' : 'MISSING'}`);
    console.log(`🔑 Access Token: ${accessToken ? 'Presente (longitud: ' + accessToken.length + ')' : 'MISSING'}`);

    if (!phoneNumberId || !accessToken) {
      console.error('❌ Credenciales de WhatsApp no configuradas');
      throw new Error('Credenciales de WhatsApp faltantes');
    }

    const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;
    console.log(`🌐 URL de API: ${url}`);

    const payload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: text }
    };
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    console.log('🚀 Enviando request a WhatsApp API...');
    
    // Agregar timeout de 5 segundos al fetch (total función debe ser < 10s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ [WHATSAPP] Timeout de 5s alcanzado, abortando...');
      controller.abort();
    }, 5000);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log(`📊 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error de WhatsApp API:', JSON.stringify(errorData, null, 2));
      throw new Error(`WhatsApp API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('✅ Respuesta de WhatsApp API:', JSON.stringify(data, null, 2));
    console.log('✅ Mensaje enviado a WhatsApp con ID:', data.messages?.[0]?.id);
    
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ TIMEOUT enviando a WhatsApp: Request abortado después de 5s');
    } else {
      console.error('❌ Error en sendWhatsAppMessage:', error.message);
      console.error('❌ Stack trace:', error.stack);
    }
    throw error;
  }
}
