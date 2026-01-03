
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

async function testInternalAssistant() {
  console.log('🧪 Probando Asistente Virtual Interno...');
  console.log(`📍 URL: ${BASE_URL}/api/internal-chat`);

  const testCases = [
    {
      name: "Consulta de Agenda",
      payload: {
        message: "¿Qué citas tenemos para mañana?",
        sessionId: "test_script_session_" + Date.now(),
        mode: "assistant",
        isNewSession: true
      }
    },
    {
      name: "Consulta de Promociones",
      payload: {
        message: "¿Qué promociones tenemos activas hoy?",
        sessionId: "test_script_session_" + Date.now(),
        mode: "assistant",
        isNewSession: false
      }
    },
    {
      name: "Consulta General",
      payload: {
        message: "¿Cuál es la dirección de la clínica?",
        sessionId: "test_script_session_" + Date.now(),
        mode: "assistant",
        isNewSession: false
      }
    }
  ];

  for (const test of testCases) {
    console.log(`\n▶️ Ejecutando prueba: ${test.name}`);
    console.log(`   Mensaje: "${test.payload.message}"`);

    try {
      const response = await fetch(`${BASE_URL}/api/internal-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Respuesta recibida:');
      console.log('---------------------------------------------------');
      console.log(data.response);
      console.log('---------------------------------------------------');

    } catch (error) {
      console.error('❌ Error en la prueba:', error.message);
      if (error.message.includes('ECONNREFUSED')) {
        console.log('⚠️  Asegúrate de que el servidor de desarrollo esté corriendo (npm run dev)');
      }
    }
  }
}

testInternalAssistant();
