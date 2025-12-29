import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

console.log("🧪 Iniciando prueba de conexión con Google Gemini...");

if (!apiKey) {
  console.error("❌ Error: No se encontró GOOGLE_GEMINI_API_KEY en el archivo .env");
  process.exit(1);
}

console.log("🔑 API Key detectada:", apiKey.substring(0, 8) + "..." + apiKey.substring(apiKey.length - 4));

async function testGemini() {
  // First, let's list models to see what's available
  const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
      console.log("📋 Listando modelos disponibles...");
      const listResponse = await axios.get(listUrl);
      const models = listResponse.data.models.map(m => m.name);
      console.log("Modelos encontrados:", models.filter(m => m.includes('gemini')));
      
      // Pick a model
      let model = 'gemini-flash-latest';
      if (!models.some(m => m.includes(model))) {
          const flashModel = models.find(m => m.includes('gemini-flash-latest'));
          if (flashModel) {
              model = flashModel.replace('models/', '');
          } else {
              model = 'gemini-pro';
          }
      }
      console.log(`🎯 Usando modelo: ${model}`);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      console.log("📡 Enviando solicitud a Google API...");
    
      const response = await axios.post(url, {
        contents: [{
          role: "user",
          parts: [{ text: "Responde con la palabra 'CONECTADO' si recibes este mensaje." }]
        }]
      });

      const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
          console.log("✅ ¡Conexión Exitosa!");
          console.log("🤖 Respuesta de Gemini:", text.trim());
      } else {
          console.warn("⚠️ Respuesta recibida pero sin texto esperado:", JSON.stringify(response.data));
      }

  } catch (error) {
    console.error("❌ Error de conexión:");
    if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Data: ${JSON.stringify(error.response.data)}`);
    } else {
        console.error(`   Message: ${error.message}`);
    }
    process.exit(1);
  }
}

testGemini();
