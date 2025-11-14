import { 
  initChatbotDatabase, 
  upsertConversation, 
  saveMessage, 
  getConversationHistory 
} from '../lib/neon-chatbot-db-vercel.js';
import { cleanupService } from '../lib/chatbot-cleanup.js';
import { chatbotAI } from '../lib/chatbot-ai-service.js';
import { FallbackStorage } from '../lib/fallback-storage.js';

// Flag para controlar si usar fallback
// TODO: Cambiar a false cuando Neon funcione correctamente
let useFallback = true; // ACTIVADO POR DEFECTO debido a timeouts de Neon

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
      
      // Responder INMEDIATAMENTE a WhatsApp (evita timeouts)
      res.status(200).send('OK');

      // Procesar mensaje de forma asíncrona
      processWhatsAppMessage(req.body).catch(error => {
        console.error('❌ Error procesando mensaje:', error);
      });

    } catch (error) {
      console.error('❌ Error en endpoint:', error);
    }
    return;
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
          setTimeout(() => reject(new Error('Timeout')), 3000)
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

    // Generar respuesta con IA (con timeout global)
    console.log('🤖 Paso 5: Generando respuesta con OpenAI...');
    let aiResult;
    try {
      // Timeout de 8 segundos para toda la operación
      const aiPromise = chatbotAI.generateResponse(userMessage, history);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT_GLOBAL')), 8000)
      );
      
      aiResult = await Promise.race([aiPromise, timeoutPromise]);
      console.log(`✅ Respuesta generada: "${aiResult.response.substring(0, 50)}..." (${aiResult.tokensUsed} tokens)`);
      
      if (aiResult.error) {
        console.error('⚠️ Error en generación de respuesta:', aiResult.error);
      }
    } catch (error) {
      console.error('❌ Error CRÍTICO generando respuesta:', error.message);
      console.log('🔄 Usando fallback de emergencia...');
      
      // Fallback de emergencia
      aiResult = {
        response: '¡Hola! 👋 Soy el asistente de BIOSKIN. Estamos experimentando problemas técnicos momentáneos. Por favor, contáctanos directamente al WhatsApp de la clínica. ¡Gracias!',
        tokensUsed: 0,
        error: error.message,
        fallback: true,
        emergency: true
      };
      
      console.log('✅ Fallback de emergencia activado');
    }

    // Guardar respuesta del asistente (con fallback)
    console.log('💾 Paso 6: Guardando respuesta del asistente...');
    await withFallback(
      () => saveMessage(sessionId, 'assistant', aiResult.response, aiResult.tokensUsed),
      () => FallbackStorage.saveMessage(sessionId, 'assistant', aiResult.response, aiResult.tokensUsed),
      'Guardar respuesta asistente'
    );
    console.log('✅ Respuesta del asistente guardada');

    // Enviar respuesta a WhatsApp (sin await para evitar timeout)
    console.log('📤 Paso 7: Enviando respuesta a WhatsApp...');
    sendWhatsAppMessage(from, aiResult.response).then(() => {
      console.log('✅ Respuesta enviada a WhatsApp');
    }).catch(error => {
      console.error('❌ Error enviando a WhatsApp:', error.message);
    });
    console.log('✅ Envío de WhatsApp iniciado (async)');

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
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

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
    console.error('❌ Error en sendWhatsAppMessage:', error.message);
    console.error('❌ Stack trace:', error.stack);
    throw error;
  }
}
