
import { google } from 'googleapis';

export default async function handler(req, res) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const resultLog = [];
  const log = (msg) => resultLog.push(msg);
  
  try {
    log('🔍 Iniciando diagnóstico de conexión Google Calendar (API Endpoint)...');

    const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
    
    if (!credentialsBase64) {
      log('❌ ERROR CRÍTICO: Variable de entorno GOOGLE_CREDENTIALS_BASE64 no encontrada.');
      throw new Error('Missing Credentials');
    }

    let credentials;
    try {
      credentials = JSON.parse(
        Buffer.from(credentialsBase64, 'base64').toString('utf8')
      );
      log('✅ Credenciales decodificadas correctamente.');
    } catch (error) {
      log('❌ ERROR: Falló la decodificación de las credenciales Base64.');
      throw error;
    }

    log(`ℹ️ Service Account: ${credentials.client_email}`);
    log(`ℹ️ Calendar ID: ${credentials.calendar_id}`);

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    log('✅ Cliente instanciado.');

    // 1. TEST LECTURA
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    log(`\n🔄 1. Probando LECTURA...`);
    const listResp = await calendar.events.list({
      calendarId: credentials.calendar_id,
      timeMin: now.toISOString(),
      timeMax: nextWeek.toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: 'startTime',
    });

    log(`✅ LECTURA EXITOSA: ${listResp.data.items.length} eventos recuperados.`);

    // 2. TEST ESCRITURA
    log(`\n🔄 2. Probando ESCRITURA (Evento Pruebas)...`);
    const testEventStart = new Date(now.getTime() + 24*60*60*1000); 
    const testEventEnd = new Date(testEventStart.getTime() + 15*60*1000);
    
    const event = {
      summary: 'TEST-DIAGNOSTICO-SISTEMA',
      description: 'Evento de prueba - Autogenerado por Panel Admin',
      start: { dateTime: testEventStart.toISOString() },
      end: { dateTime: testEventEnd.toISOString() },
    };

    const insertResp = await calendar.events.insert({
      calendarId: credentials.calendar_id,
      resource: event,
    });

    if (insertResp.status === 200) {
        log(`✅ ESCRITURA EXITOSA: Evento creado ID: ${insertResp.data.id}`);
        
        // 3. TEST ELIMINACIÓN
        log('\n🔄 3. Probando ELIMINACIÓN (Limpieza)...');
        await calendar.events.delete({
            calendarId: credentials.calendar_id,
            eventId: insertResp.data.id
        });
        log('✅ ELIMINACIÓN EXITOSA: Evento borrado.');
    } else {
        log('❌ ERROR EN ESCRITURA');
        throw new Error('Insert Failed');
    }

    return res.status(200).json({
      success: true,
      message: 'Sistema Google Calendar Operativo',
      logs: resultLog
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error en prueba de conexión',
      error: error.message,
      logs: resultLog
    });
  }
}
