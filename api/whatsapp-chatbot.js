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
import { 
  getStateMachine, 
  saveStateMachine,
  APPOINTMENT_STATES 
} from '../lib/appointment-state-machine.js';
// import { notifyNewConversation } from '../lib/admin-notifications.js'; // Temporalmente deshabilitado para debug

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
  try {
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
              hasPostgresDb: !!process.env.POSTGRES_URL,
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
        return res.status(500).json({ 
          error: 'Error en verificación',
          message: error.message,
          stack: error.stack 
        });
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
    
  } catch (topLevelError) {
    console.error('❌ ERROR CRÍTICO EN HANDLER:', topLevelError);
    return res.status(500).json({
      error: 'Critical handler error',
      message: topLevelError.message,
      stack: topLevelError.stack,
      type: topLevelError.constructor.name
    });
  }
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
    const conversationResult = await withFallback(
      () => upsertConversation(sessionId, from),
      () => FallbackStorage.saveConversation(sessionId, from),
      'Upsert conversación'
    );
    console.log('✅ Conversación actualizada');

    // Obtener historial de conversación ANTES de la notificación (con fallback)
    console.log('💾 Paso 3: Obteniendo historial...');
    const history = await withFallback(
      () => getConversationHistory(sessionId, 20),
      () => FallbackStorage.getConversationHistory(sessionId, 20),
      'Obtener historial'
    );
    console.log(`✅ Historial obtenido: ${history.length} mensajes`);

    // Notificar al admin si es una nueva conversación O si han pasado >15 minutos desde el último mensaje
    const shouldNotifyNew = conversationResult?.isNew;
    let shouldNotifyInactive = false;
    
    if (!shouldNotifyNew && history.length > 0) {
      // El historial viene ordenado DESC (más reciente primero)
      // Como obtenemos el historial ANTES de guardar el mensaje actual,
      // history[0] es el mensaje más reciente ANTES del mensaje que acaba de llegar
      const lastMessage = history[0];
      
      if (lastMessage && lastMessage.created_at) {
        const lastMessageTime = new Date(lastMessage.created_at).getTime();
        const currentTime = Date.now();
        const minutesSinceLastMessage = (currentTime - lastMessageTime) / 60000;
        
        console.log(`⏰ Último mensaje: ${lastMessage.created_at}, Tiempo transcurrido: ${minutesSinceLastMessage.toFixed(1)} minutos`);
        
        if (minutesSinceLastMessage > 15) {
          shouldNotifyInactive = true;
          console.log('🔔 >15 minutos de inactividad - enviando notificación');
          await notifyStaffGroup('consultation', {
            phone: from,
            message: userMessage,
            inactivityMinutes: Math.floor(minutesSinceLastMessage)
          }, from).catch(err => {
            console.error('⚠️ Error enviando notificación (no crítico):', err);
          });
        } else {
          console.log(`✅ Conversación activa (${minutesSinceLastMessage.toFixed(1)} min) - no notificar`);
        }
      } else {
        console.log('⚠️ No se pudo obtener timestamp del último mensaje');
      }
    } else if (shouldNotifyNew) {
      console.log('🆕 Nueva conversación detectada - enviando notificación');
      await notifyStaffGroup('consultation', {
        phone: from,
        message: userMessage
      }, from).catch(err => {
        console.error('⚠️ Error enviando notificación (no crítico):', err);
      });
    }

    // Guardar mensaje del usuario (con fallback)
    console.log('💾 Paso 4: Guardando mensaje del usuario...');
    await withFallback(
      () => saveMessage(sessionId, 'user', userMessage, 0, messageId),
      () => FallbackStorage.saveMessage(sessionId, 'user', userMessage, 0, messageId),
      'Guardar mensaje usuario'
    );
    console.log('✅ Mensaje del usuario guardado');

    // Actualizar historial después de guardar el mensaje del usuario
    console.log('💾 Paso 5: Actualizando historial...');
    const updatedHistory = await withFallback(
      () => getConversationHistory(sessionId, 20),
      () => FallbackStorage.getConversationHistory(sessionId, 20),
      'Actualizar historial'
    );
    console.log(`✅ Historial actualizado: ${updatedHistory.length} mensajes`);

    // ============================================
    // PASO 4.5: SISTEMA DE MÁQUINA DE ESTADOS PARA AGENDAMIENTO
    // ============================================
    console.log('📅 Paso 4.5: Verificando estado de agendamiento...');
    
    // Obtener o crear máquina de estados para esta sesión
    const stateMachine = getStateMachine(sessionId, from);
    console.log(`🔧 [StateMachine] Estado actual: ${stateMachine.state}`);
    
    // Variable para respuesta directa (bypass IA si estamos en flujo de agendamiento)
    let directResponse = null;
    let skipAI = false; // ⚠️ CRÍTICO: Si true, NO usar IA bajo ninguna circunstancia
    
    // Detectar intención básica
    const intent = chatbotAI.detectIntent(userMessage);
    
    // CASO 1: Usuario quiere iniciar agendamiento y está en IDLE
    if (intent === 'appointment' && stateMachine.state === APPOINTMENT_STATES.IDLE) {
      console.log('🎯 [StateMachine] Usuario solicita agendamiento');
      
      // Verificar si el usuario ya eligió la opción 2 (guía paso a paso)
      // Patrones: "por aquí", "aquí", "opción 2", "la 2", "guíame", "ayúdame", "paso a paso"
      const wantsGuidance = /(por\s+)?aqu[íi]|opci[óo]n\s*2|la\s*2|gu[íi]a|ayuda|paso\s+a\s+paso|contigo|asist/i.test(userMessage);
      
      console.log(`🔍 [StateMachine] ¿Usuario quiere guía? ${wantsGuidance} (mensaje: "${userMessage}")`);
      
      if (wantsGuidance) {
        // Iniciar la máquina de estados
        console.log('✅ [StateMachine] Iniciando flujo guiado');
        const result = stateMachine.start(from);
        directResponse = result.message;
        saveStateMachine(sessionId, stateMachine);
      } else {
        // Ofrecer opciones
        console.log('📋 [StateMachine] Ofreciendo opciones de agendamiento');
        directResponse = `¡Con gusto! 😊 Puedo ayudarte de dos formas:\n\n` +
                       `1️⃣ Agenda directamente aquí: ${APPOINTMENT_LINK}\n` +
                       `2️⃣ Te ayudo aquí mismo (reviso horarios disponibles)\n\n` +
                       `¿Cuál prefieres?`;
      }
    }
    // CASO 1.5: Usuario está en IDLE pero responde con preferencia de opción (sin mencionar "agendar")
    else if (stateMachine.state === APPOINTMENT_STATES.IDLE) {
      // Detectar si el usuario está respondiendo a la pregunta "¿Cuál prefieres?"
      const lastBotMsg = updatedHistory.filter(m => m.role === 'assistant').pop()?.content || '';
      const botOfferedOptions = lastBotMsg.includes('Puedo ayudarte de dos formas') || 
                                lastBotMsg.includes('¿Cuál prefieres?');
      
      if (botOfferedOptions) {
        const wantsGuidance = /(por\s+)?aqu[íi]|opci[óo]n\s*2|la\s*2|gu[íi]a|ayuda|paso\s+a\s+paso|contigo|asist/i.test(userMessage);
        const wantsLink = /opci[óo]n\s*1|la\s*1|link|directo|solo|dame/i.test(userMessage);
        
        console.log(`🔍 [StateMachine] Bot ofreció opciones, usuario respondió: guidance=${wantsGuidance}, link=${wantsLink}`);
        
        if (wantsGuidance) {
          console.log('✅ [StateMachine] Usuario eligió guía paso a paso');
          const result = stateMachine.start(from);
          directResponse = result.message;
          saveStateMachine(sessionId, stateMachine);
        } else if (wantsLink) {
          console.log('✅ [StateMachine] Usuario eligió link directo');
          directResponse = `Perfecto, aquí está el link para agendar:\n\n${APPOINTMENT_LINK}\n\n¡Te esperamos! 😊`;
        }
      }
      
      // CASO ESPECIAL: Usuario pregunta directamente por disponibilidad de una fecha
      // Ejemplo: "Podrías decirme si hay disponibilidad para mañana"
      const asksAvailability = /(disponibilidad|disponible|libre|horario|puedo\s+ir).*?(ma[ñn]ana|pasado|lunes|martes|miércoles|jueves|viernes|sábado|\d{1,2}\/\d{1,2})/i.test(userMessage);
      
      if (asksAvailability && !botOfferedOptions) {
        console.log('🔍 [StateMachine] Usuario pregunta por disponibilidad de fecha específica');
        // Iniciar el flujo automáticamente sin ofrecer opciones
        const result = stateMachine.start(from);
        directResponse = result.message;
        saveStateMachine(sessionId, stateMachine);
      }
    }
    // CASO 2: Ya hay un flujo de agendamiento activo
    else if (stateMachine.isActive()) {
      console.log('🔄 [StateMachine] Procesando mensaje en flujo activo');
      skipAI = true; // ⚠️ CRÍTICO: Máquina de estados tiene control total
      
      try {
        // Crear callback para notificar al staff cuando se crea una cita
        const onAppointmentCreated = async (appointmentData) => {
          console.log('📢 [Webhook] Ejecutando notificación al staff...');
          await notifyStaffNewAppointment(appointmentData, from);
        };

        const result = await stateMachine.processMessage(userMessage, onAppointmentCreated);
        directResponse = result.message;
        
        // Guardar estado actualizado
        saveStateMachine(sessionId, stateMachine);
        
        // Si se completó el agendamiento, limpiar la máquina
        if (result.completed) {
          console.log('✅ [StateMachine] Agendamiento completado, limpiando máquina');
          stateMachine.reset();
          skipAI = false; // Permitir IA de nuevo después de completar
        }
        
        console.log(`✅ [StateMachine] Nuevo estado: ${stateMachine.state}`);
      } catch (error) {
        console.error('❌ [StateMachine] Error procesando mensaje:', error);
        directResponse = `⚠️ Hubo un problema procesando tu solicitud.\n\n¿Quieres empezar de nuevo o prefieres agendar en: ${APPOINTMENT_LINK}?`;
        stateMachine.reset();
        skipAI = false;
      }
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
    
    // ✅ SI HAY RESPUESTA DIRECTA (de flujo de agendamiento), USARLA EN LUGAR DE IA
    if (directResponse) {
      console.log(`✅ Usando respuesta directa del flujo de agendamiento: "${directResponse.substring(0, 50)}..."`);
      aiResult = {
        response: directResponse,
        tokensUsed: 0,
        fallback: false,
        direct: true
      };
    }
    // ⚠️ CRÍTICO: Si skipAI está activado, NO usar IA bajo ninguna circunstancia
    else if (skipAI) {
      console.log('⚠️ [CRÍTICO] skipAI activado - Máquina de estados tiene control total');
      // Esto no debería pasar, pero si pasa, informar al usuario
      aiResult = {
        response: 'Estoy procesando tu solicitud de agendamiento. Por favor espera un momento...',
        tokensUsed: 0,
        fallback: false,
        error: 'skipAI activo sin directResponse'
      };
    }
    // TEMPORAL: Usar solo fallback para debug
    else if (DISABLE_OPENAI) {
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
        console.log('⏰ [WEBHOOK] ¡TIMEOUT GLOBAL alcanzado! (15s)');
      }, 15000); // Aumentado a 15 segundos
      
      try {
        console.log('🚀 [WEBHOOK] Iniciando generación de respuesta...');
        aiResult = await chatbotAI.generateResponse(userMessage, updatedHistory, calendarTools);
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
                           updatedHistory.slice(-2).some(m => m.role === 'assistant' && 
                           m.content.toLowerCase().includes('conecte con la dra')));
    
    let finalResponse = aiResult.response;
    
    if (shouldTransfer) {
      console.log('📞 Transferencia a Dra. Daniela solicitada');
      
      // Generar link de WhatsApp con resumen
      const whatsappLink = chatbotAI.generateDoctorWhatsAppLink(updatedHistory);
      
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

/**
 * ⚠️ IMPORTANTE: Según documentación oficial, NO se pueden agregar participantes
 * directamente al crear el grupo. El flujo correcto es:
 * 1. Crear grupo (solo subject y description)
 * 2. Recibir webhook con invite_link
 * 3. Enviar invite_link a los usuarios
 * 4. Usuarios hacen clic y se unen
 * 
 * Por simplicidad operativa, usamos fallback a mensajes individuales.
 * @returns {Promise<string|null>} Group ID o null si falla
 */
async function ensureStaffGroupExists() {
  let groupId = process.env.WHATSAPP_STAFF_GROUP_ID;
  
  if (groupId) {
    console.log(`✅ [STAFF GROUP] Group ID configurado: ${groupId}`);
    return groupId;
  }

  console.log('⚠️ [STAFF GROUP] Group ID no configurado');
  console.log('📖 [STAFF GROUP] Para crear grupo, ver: docs/WHATSAPP-GROUP-SETUP-CORRECTED.md');
  console.log('🔄 [STAFF GROUP] Usando fallback a mensajes individuales');
  
  return null;
}

/**
 * Notifica al grupo de staff sobre eventos importantes
 * @param {string} eventType - Tipo de evento: 'appointment', 'referral', 'consultation'
 * @param {Object} data - Datos del evento
 * @param {string} patientPhone - Número de teléfono del paciente
 */
/**
 * Notifica al personal de BIOSKIN sobre eventos importantes
 * Usa el número principal con diferenciación por tema (médico/técnico)
 */
async function notifyStaffGroup(eventType, data, patientPhone) {
  console.log(`📢 [NOTIFICACIÓN BIOSKIN] Evento tipo: ${eventType}`);
  
  // Enviar directamente al número principal de BIOSKIN
  // La función sendToStaffIndividually maneja la diferenciación por tema
  return await sendToStaffIndividually(eventType, data, patientPhone);
}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 

/**
 * Envía notificación al número principal de BIOSKIN
 * Diferencia entre temas médicos (Dra. Daniela) y técnicos (Ing. Rafael)
 */
async function sendToStaffIndividually(eventType, data, patientPhone) {
  const BIOSKIN_NUMBER = '+593969890689'; // Número principal de BIOSKIN

  console.log(`📤 [NOTIFICACIÓN] Enviando al número principal de BIOSKIN`);

  // Determinar destinatario según el tipo de consulta
  let recipient = '';
  let ismedical = true;
  
  // Detectar si es tema técnico o de equipos
  const technicalKeywords = /(equipo|aparato|dispositivo|máquina|laser|hifu|tecnología|compra|precio.*equipo|producto.*estético|aparatología)/i;
  const dataText = JSON.stringify(data).toLowerCase();
  
  if (technicalKeywords.test(dataText) || eventType === 'technical_inquiry') {
    recipient = 'Ing. Rafael Larrea';
    isMedical = false;
  } else {
    recipient = 'Dra. Daniela Creamer';
    isMedical = true;
  }

  // Construir mensaje
  const patientChatLink = `https://wa.me/${patientPhone.replace(/\D/g, '')}`;
  let message = '';
  
  switch (eventType) {
    case 'appointment':
      const dateObj = new Date(data.date + 'T00:00:00-05:00');
      const dateFormatted = dateObj.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long',
        timeZone: 'America/Guayaquil'
      });
      
      message = `🗓️ *NUEVA CITA AGENDADA*\n` +
        `📋 *Para:* ${recipient}\n\n` +
        `👤 *Paciente:* ${data.name}\n` +
        `📱 *Teléfono:* ${patientPhone}\n` +
        `💆 *Tratamiento:* ${data.service}\n` +
        `📅 *Fecha:* ${dateFormatted}\n` +
        `⏰ *Hora:* ${data.hour}\n\n` +
        `💬 *Chat directo:* ${patientChatLink}`;
      break;
      
    case 'referral':
      message = `👨‍⚕️ *DERIVACIÓN*\n` +
        `📋 *Para:* ${recipient}\n\n` +
        `👤 *Paciente:* ${data.name || 'No proporcionado'}\n` +
        `📱 *Teléfono:* ${patientPhone}\n` +
        `🔍 *Motivo:* ${data.reason}\n` +
        `📝 *Resumen:*\n${data.summary}\n\n` +
        `💬 *Chat directo:* ${patientChatLink}`;
      break;
      
    case 'consultation':
      message = `❓ *CONSULTA IMPORTANTE*\n` +
        `📋 *Para:* ${recipient}\n\n` +
        `👤 *Paciente:* ${data.name || 'No identificado'}\n` +
        `📱 *Teléfono:* ${patientPhone}\n` +
        `💬 *Consulta:* ${data.query}\n` +
        `🤖 *Respuesta bot:* ${data.botResponse || 'Pendiente'}\n\n` +
        `💬 *Chat directo:* ${patientChatLink}`;
      break;
  }

  try {
    console.log(`📤 Enviando notificación a BIOSKIN (${recipient})...`);
    await sendWhatsAppMessage(BIOSKIN_NUMBER, message);
    console.log(`✅ Notificación enviada exitosamente`);
    
    return {
      success: true,
      target: 'bioskin_main',
      recipient: recipient,
      number: BIOSKIN_NUMBER
    };
  } catch (error) {
    console.error(`❌ Error enviando notificación:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * DEPRECATED: Usar notifyStaffGroup() en su lugar
 * Notifica al staff cuando se crea una nueva cita
 * @param {Object} appointmentData - Datos de la cita creada
 * @param {string} patientPhone - Número de teléfono del paciente
 */
async function notifyStaffNewAppointment(appointmentData, patientPhone) {
  return notifyStaffGroup('appointment', appointmentData, patientPhone);
}
