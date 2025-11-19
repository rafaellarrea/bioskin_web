/**
 * Endpoint de prueba ULTRA SIMPLE para diagnosticar el chatbot
 * Solo verifica recepción de webhooks y responde con mensaje básico
 */

export default async function handler(req, res) {
  console.log('🧪 [TEST] Webhook recibido');
  console.log('🧪 [TEST] Método:', req.method);
  console.log('🧪 [TEST] Body:', JSON.stringify(req.body, null, 2));
  
  // Verificación GET
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('🧪 [TEST] Verificación GET:', { mode, token, challenge });
    
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ [TEST] Verificación exitosa');
      return res.status(200).send(challenge);
    }
    
    return res.status(403).send('Forbidden');
  }
  
  // Mensaje POST
  if (req.method === 'POST') {
    try {
      const entry = req.body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];
      
      if (!message) {
        console.log('⚠️ [TEST] No hay mensaje, probablemente webhook de estado');
        return res.status(200).send('OK');
      }
      
      const from = message.from;
      const userMessage = message.text?.body || 'Sin texto';
      
      console.log('✅ [TEST] Mensaje detectado:', { from, userMessage });
      
      // INTENTAR ENVIAR RESPUESTA SIMPLE
      const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      
      console.log('🔑 [TEST] Credenciales:', {
        phoneNumberId: phoneNumberId ? 'Presente' : 'FALTA',
        accessToken: accessToken ? 'Presente' : 'FALTA'
      });
      
      if (!phoneNumberId || !accessToken) {
        console.error('❌ [TEST] Credenciales faltantes');
        return res.status(200).send('OK');
      }
      
      const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;
      const testResponse = '🧪 TEST: Bot funcionando correctamente';
      
      console.log('📤 [TEST] Enviando respuesta de prueba...');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: from,
          type: 'text',
          text: { body: testResponse }
        })
      });
      
      console.log('📊 [TEST] Status de WhatsApp API:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [TEST] Error de API:', errorData);
      } else {
        const data = await response.json();
        console.log('✅ [TEST] Mensaje enviado:', data.messages?.[0]?.id);
      }
      
      return res.status(200).send('OK');
      
    } catch (error) {
      console.error('❌ [TEST] Error:', error.message);
      console.error('❌ [TEST] Stack:', error.stack);
      return res.status(200).send('OK');
    }
  }
  
  return res.status(405).send('Method not allowed');
}
