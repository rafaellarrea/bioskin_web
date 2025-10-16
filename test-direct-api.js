// test-direct-api.js
// Prueba directa de las APIs sin servidor web

// Cargar variables de entorno PRIMERO
import dotenv from 'dotenv';
dotenv.config();

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simular el objeto req/res de Vercel
const createMockRequest = (method = 'POST', body = {}) => ({
  method,
  body,
  headers: {
    'content-type': 'application/json'
  }
});

const createMockResponse = () => {
  const response = {
    statusCode: 200,
    headers: {},
    body: '',
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    setHeader: function(key, value) {
      this.headers[key] = value;
      return this;
    },
    json: function(data) {
      this.body = JSON.stringify(data);
      console.log(`📤 Respuesta ${this.statusCode}:`, JSON.stringify(data, null, 2));
      return this;
    },
    end: function() {
      console.log('✅ Respuesta enviada');
      return this;
    }
  };
  return response;
};

const testAPIs = async () => {
  console.log('🧪 Prueba directa de APIs de BIOSKIN\n');
  
  // Test 1: API de diagnóstico
  console.log('1️⃣ Probando API de diagnóstico...');
  try {
    const { default: testHandler } = await import('./api/blogs/test.js');
    const req = createMockRequest('GET');
    const res = createMockResponse();
    
    await testHandler(req, res);
    console.log('✅ API de diagnóstico OK\n');
  } catch (error) {
    console.log('❌ Error en API de diagnóstico:', error.message);
    console.log('Stack:', error.stack);
  }
  
  console.log('---\n');
  
  // Test 2: API segura de generación
  console.log('2️⃣ Probando API segura de generación...');
  try {
    const { default: safeHandler } = await import('./api/ai-blog/generate-safe.js');
    const req = createMockRequest('POST', {
      blogType: 'medico-estetico',
      topic: 'Tratamientos de rejuvenecimiento con HIFU'
    });
    const res = createMockResponse();
    
    await safeHandler(req, res);
    console.log('✅ API segura OK\n');
  } catch (error) {
    console.log('❌ Error en API segura:', error.message);
    console.log('Stack:', error.stack);
  }
  
  console.log('---\n');
  
  // Test 3: Verificar variables de entorno
  console.log('3️⃣ Verificando variables de entorno...');
  console.log('OPENAI_API_KEY disponible:', !!process.env.OPENAI_API_KEY);
  console.log('OPENAI_API_KEY inicia con sk-:', process.env.OPENAI_API_KEY?.startsWith('sk-') || false);
  console.log('EMAIL_USER:', process.env.EMAIL_USER || 'No configurado');
  
  console.log('\n✅ Pruebas completadas');
};

testAPIs().catch(console.error);