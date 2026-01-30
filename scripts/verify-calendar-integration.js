
import { google } from 'googleapis';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
try {
  require('dotenv').config();
} catch (e) {
  console.log('⚠️ .env loading failed or not needed if vars are in env');
}

async function testConnection() {
  console.log('🔍 Iniciando diagnóstico de conexión Google Calendar Completo...');

  const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
  
  if (!credentialsBase64) {
    console.error('❌ ERROR CRÍTICO: Variable de entorno GOOGLE_CREDENTIALS_BASE64 no encontrada.');
    return;
  }

  let credentials;
  try {
    credentials = JSON.parse(
      Buffer.from(credentialsBase64, 'base64').toString('utf8')
    );
  } catch (error) {
    console.error('❌ ERROR: Falló la decodificación de las credenciales Base64.');
    return;
  }

  console.log(`ℹ️ Email Cliente (Service Account): ${credentials.client_email}`);
  console.log(`ℹ️ Calendario Objetivo: ${credentials.calendar_id}`);

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    console.log('✅ Cliente inicializado.');

    // 1. TEST LECTURA (Próximos 7 días)
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    console.log(`\n🔄 1. Probando LECTURA (Eventos ${now.toISOString().split('T')[0]} a ${nextWeek.toISOString().split('T')[0]})...`);

    const listResp = await calendar.events.list({
      calendarId: credentials.calendar_id,
      timeMin: now.toISOString(),
      timeMax: nextWeek.toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    console.log(`✅ LECTURA EXITOSA: ${listResp.data.items.length} eventos encontrados.`);
    listResp.data.items.forEach(e => {
        console.log(`   - [${e.start.dateTime || e.start.date}] ${e.summary}`);
    });

    // 2. TEST ESCRITURA (Crear evento de prueba)
    console.log('\n🔄 2. Probando ESCRITURA (Crear evento de prueba)...');
    
    // Crear evento para mañana a esta hora
    const testEventStart = new Date(now.getTime() + 24*60*60*1000); 
    const testEventEnd = new Date(testEventStart.getTime() + 30*60*1000);
    
    const event = {
      summary: 'TEST-SYSTEMA-AGENDAMIENTO-VERIFICACION',
      description: 'Evento de prueba generado automáticamente para verificar integridad del sistema.',
      start: { dateTime: testEventStart.toISOString() },
      end: { dateTime: testEventEnd.toISOString() },
    };

    const insertResp = await calendar.events.insert({
      calendarId: credentials.calendar_id,
      resource: event,
    });

    if (insertResp.status === 200) {
        console.log(`✅ ESCRITURA EXITOSA: Evento creado ID: ${insertResp.data.id}`);
        
        // 3. TEST ELIMINACIÓN (Limpieza)
        console.log('\n🔄 3. Probando ELIMINACIÓN (Borrar evento de prueba)...');
        await calendar.events.delete({
            calendarId: credentials.calendar_id,
            eventId: insertResp.data.id
        });
        console.log('✅ ELIMINACIÓN EXITOSA: Evento borrado.');
        console.log('\n🎉 CONCLUSIÓN: El sistema de integración con Google Calendar está FUNCIONANDO CORRECTAMENTE (Lectura/Escritura/Eliminación verificados).');
    } else {
        console.error('❌ ERROR EN ESCRITURA: Respuesta no exitosa', insertResp);
    }

  } catch (error) {
    console.error('❌ ERROR CRÍTICO DURANTE PRUEBAS DE INTEGRACIÓN:');
    console.error(error.message);
    if (error.response) {
       if (error.response.data.error === 'invalid_grant') {
           console.error('🚨 DIAGNÓSTICO: Las credenciales son inválidas o han expirado. Posiblemente la clave privada es incorrecta.');
       } else if (error.code === 404) {
           console.error('🚨 DIAGNÓSTICO: No se encontró el calendario ID especificado. Verifique el ID del calendario.');
       } else if (error.code === 403) {
           console.error('🚨 DIAGNÓSTICO: Permisos insuficientes (403). Verifique que el correo de la "Service Account" (' + credentials.client_email + ') tenga permisos de "Realizar cambios en eventos" en la configuración del calendario original (' + credentials.calendar_id + ').');
       }
    }
  }
}

testConnection();
