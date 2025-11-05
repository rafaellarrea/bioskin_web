// Función simple de test para diagnosticar problemas básicos
module.exports = async function handler(req, res) {
  // Headers CORS básicos
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🧪 Test Simple - Method:', req.method);
    console.log('🧪 Test Simple - Headers:', req.headers);
    console.log('🧪 Test Simple - Body:', req.body);
    console.log('🧪 Test Simple - Query:', req.query);

    // Test básico de respuesta JSON
    const response = {
      success: true,
      message: 'Test simple funcionando correctamente',
      timestamp: new Date().toISOString(),
      method: req.method,
      userAgent: req.headers['user-agent'],
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        hasGoogleCredentials: !!process.env.GOOGLE_CREDENTIALS_BASE64
      }
    };

    console.log('🧪 Test Simple - Enviando respuesta:', response);

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Test Simple - Error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};