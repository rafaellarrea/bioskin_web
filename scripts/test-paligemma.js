const API_URL = "https://suffocatingly-unlunate-tonya.ngrok-free.dev";

console.log(`🔌 Probando conexión con PaliGemma en: ${API_URL}`);

async function testConnection() {
  try {
    const start = Date.now();
    const response = await fetch(`${API_URL}/`);
    const duration = Date.now() - start;
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ ¡Conexión EXITOSA!');
    console.log(`⏱️ Latencia: ${duration}ms`);
    console.log('📄 Respuesta del servidor:', data);
    
    if (data.status === 'online') {
        console.log('\n✨ El sistema está listo para recibir imágenes.');
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('\n⚠️ Verifica que la celda del servidor en Google Colab esté ejecutándose y no haya errores.');
  }
}

testConnection();
