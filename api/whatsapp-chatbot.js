import { 
  initChatbotDatabase, 
  upsertConversation, 
  saveMessage, 
  getConversationHistory 
} from '../lib/neon-chatbot-db.js';
import { cleanupService } from '../lib/chatbot-cleanup.js';
import { chatbotAI } from '../lib/chatbot-ai-service.js';

/**
 * ENDPOINT PRINCIPAL DEL CHATBOT DE WHATSAPP
 * Maneja verificación del webhook y procesamiento de mensajes
 * 
 * Variables de entorno requeridas:
 * - NEON_DATABASE_URL: URL de conexión a Neon PostgreSQL
 * - OPENAI_API_KEY: API key de OpenAI (ya configurada)
 * - WHATSAPP_VERIFY_TOKEN: Token para verificación del webhook
 * - WHATSAPP_ACCESS_TOKEN: Token de acceso de WhatsApp Business API
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
      // Responder INMEDIATAMENTE a WhatsApp (evita timeouts)
      res.status(200).send('OK');

      // Procesar mensaje de forma asíncrona
      await processWhatsAppMessage(req.body).catch(error => {
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

    // Inicializar base de datos si es necesario
    await initChatbotDatabase().catch(err => {
      console.log('ℹ️ Base de datos ya inicializada');
    });

    // Crear/actualizar conversación
    await upsertConversation(sessionId, from);

    // Guardar mensaje del usuario
    await saveMessage(sessionId, 'user', userMessage, 0, messageId);

    // Obtener historial de conversación
    const history = await getConversationHistory(sessionId, 20);

    // Generar respuesta con IA
    console.log('🤖 Generando respuesta con OpenAI...');
    const aiResult = await chatbotAI.generateResponse(userMessage, history);

    if (aiResult.error) {
      console.error('❌ Error en generación de respuesta:', aiResult.error);
    }

    // Guardar respuesta del asistente
    await saveMessage(sessionId, 'assistant', aiResult.response, aiResult.tokensUsed);

    // Enviar respuesta a WhatsApp
    await sendWhatsAppMessage(from, aiResult.response);

    // Limpieza ligera ocasional (10% de probabilidad)
    if (Math.random() < 0.1) {
      cleanupService.lightCleanup().catch(err => {
        console.log('⚠️ Error en limpieza ligera:', err);
      });
    }

    console.log('✅ Mensaje procesado exitosamente');
  } catch (error) {
    console.error('❌ Error en processWhatsAppMessage:', error);
    throw error;
  }
}

/**
 * Envía un mensaje a través de WhatsApp Business API
 */
async function sendWhatsAppMessage(to, text) {
  try {
    const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      console.error('❌ Credenciales de WhatsApp no configuradas');
      return;
    }

    const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error enviando mensaje a WhatsApp:', errorData);
      throw new Error(`WhatsApp API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Mensaje enviado a WhatsApp:', data.messages?.[0]?.id);
    
    return data;
  } catch (error) {
    console.error('❌ Error en sendWhatsAppMessage:', error);
    throw error;
  }
}
