/**
 * WhatsApp Chatbot Webhook - Version Minima Sin Dependencias Problemáticas
 * Solo funciones esenciales para recibir y responder mensajes
 */

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

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

        console.log('🔐 Verificación de webhook:', { mode, token: token ? '***' : 'missing' });

        // Página de información
        if (!mode && !token && !challenge) {
          return res.status(200).json({
            status: 'ok',
            message: 'WhatsApp Chatbot Webhook - Version Minima',
            info: 'Webhook activo y funcionando',
            environment: {
              hasVerifyToken: !!process.env.WHATSAPP_VERIFY_TOKEN,
              hasAccessToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
              hasPhoneNumberId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
              hasOpenAI: !!process.env.OPENAI_API_KEY,
              nodeVersion: process.version
            },
            timestamp: new Date().toISOString()
          });
        }

        // Verificar token
        if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
          console.log('✅ Webhook verificado correctamente');
          return res.status(200).send(challenge);
        }

        return res.status(403).json({ error: 'Token verification failed' });
      } catch (error) {
        console.error('❌ Error en verificación:', error);
        return res.status(500).json({ 
          error: 'Error en verificación',
          message: error.message 
        });
      }
    }

    // ============================================
    // PROCESAMIENTO DE MENSAJES (POST)
    // ============================================
    if (req.method === 'POST') {
      try {
        console.log('🔵 Webhook POST recibido');
        
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        // Ignorar webhooks de estado
        if (!message && value?.statuses) {
          console.log('ℹ️ Webhook de estado ignorado');
          return res.status(200).send('OK');
        }

        // Ignorar mensajes propios
        if (!message || message.from === process.env.WHATSAPP_PHONE_NUMBER_ID) {
          return res.status(200).send('OK');
        }

        const from = message.from;
        const messageId = message.id;
        const messageType = message.type;
        let userMessage = '';

        // Extraer texto del mensaje
        if (messageType === 'text') {
          userMessage = message.text.body;
        } else if (messageType === 'interactive') {
          if (message.interactive.type === 'button_reply') {
            userMessage = message.interactive.button_reply.title;
          } else if (message.interactive.type === 'list_reply') {
            userMessage = message.interactive.list_reply.title;
          }
        } else {
          userMessage = `[${messageType}]`;
        }

        console.log('📱 Mensaje recibido:', { from, messageType, text: userMessage.substring(0, 50) });

        // Generar respuesta simple basada en palabras clave
        let responseMessage = '';
        const lowerMsg = userMessage.toLowerCase();

        if (/^(hola|buenos|buenas|hi|hey)/i.test(lowerMsg)) {
          responseMessage = '¡Hola! 👋 Bienvenido a BIOSKIN.\n\n' +
            'Somos especialistas en medicina estética. ¿En qué puedo ayudarte?\n\n' +
            '• Información sobre tratamientos\n' +
            '• Agendar una cita\n' +
            '• Consultar precios\n' +
            '• Ubicación y horarios';
        } 
        else if (/(agendar|cita|reservar|turno|hora)/i.test(lowerMsg)) {
          responseMessage = '📅 *Agenda tu cita en BIOSKIN*\n\n' +
            'Para agendar tu cita, por favor visita:\n' +
            'https://saludbioskin.vercel.app/#/appointment\n\n' +
            'O llámanos al: 📞 +593 96 989 0689\n\n' +
            '¿Qué tratamiento te interesa?';
        }
        else if (/(tratamiento|servicio|procedimiento)/i.test(lowerMsg)) {
          responseMessage = '💆‍♀️ *Nuestros Tratamientos*\n\n' +
            '✨ Rejuvenecimiento facial\n' +
            '💉 Aplicación de toxina botulínica\n' +
            '💧 Rellenos de ácido hialurónico\n' +
            '🧴 Limpieza facial profunda\n' +
            '⚡ Radiofrecuencia\n' +
            '🔬 Mesoterapia\n\n' +
            'Más info: https://saludbioskin.vercel.app/#/services';
        }
        else if (/(precio|costo|cuanto|valor)/i.test(lowerMsg)) {
          responseMessage = '💰 *Información de Precios*\n\n' +
            'Los precios varían según el tratamiento. ' +
            'Te invitamos a una valoración GRATUITA donde un especialista evaluará tu caso.\n\n' +
            '📞 Llámanos: +593 96 989 0689\n' +
            'O agenda tu valoración aquí:\n' +
            'https://saludbioskin.vercel.app/#/appointment';
        }
        else if (/(ubicacion|direccion|donde|mapa)/i.test(lowerMsg)) {
          responseMessage = '📍 *Nuestra Ubicación*\n\n' +
            'Centro Médico BIOSKIN\n' +
            'Guayaquil, Ecuador\n\n' +
            '🕐 Horarios:\n' +
            'Lunes a Viernes: 9:00 AM - 7:00 PM\n' +
            'Sábados: 9:00 AM - 2:00 PM\n\n' +
            '📞 Teléfono: +593 96 989 0689\n' +
            'Más info: https://saludbioskin.vercel.app/#/contact';
        }
        else {
          responseMessage = 'Gracias por tu mensaje. 😊\n\n' +
            'Puedo ayudarte con:\n\n' +
            '📋 Información sobre tratamientos\n' +
            '📅 Agendar una cita\n' +
            '💰 Consultar precios\n' +
            '📍 Ubicación y horarios\n\n' +
            '¿Qué te gustaría saber?';
        }

        // Enviar respuesta por WhatsApp API
        await sendWhatsAppMessage(from, responseMessage);
        
        console.log('✅ Respuesta enviada exitosamente');
        return res.status(200).send('OK');

      } catch (error) {
        console.error('❌ Error procesando mensaje:', error);
        return res.status(200).send('OK');
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (topLevelError) {
    console.error('❌ ERROR CRÍTICO:', topLevelError);
    return res.status(500).json({
      error: 'Critical error',
      message: topLevelError.message
    });
  }
}

/**
 * Envía un mensaje de texto por WhatsApp
 */
async function sendWhatsAppMessage(to, text) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('Credenciales de WhatsApp no configuradas');
  }

  const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: text }
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('❌ Error enviando mensaje WhatsApp:', data);
    throw new Error(`WhatsApp API error: ${JSON.stringify(data)}`);
  }

  return data;
}
