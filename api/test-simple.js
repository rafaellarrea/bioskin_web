// api/test-simple.js
// Endpoint de prueba simple para verificar que las APIs funcionan

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const testData = {
    success: true,
    message: 'API funcionando correctamente en Vercel',
    endpoint: '/api/test-simple',
    timestamp: new Date().toISOString(),
    method: req.method,
    environment: {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      openaiKey: process.env.OPENAI_API_KEY ? 'Configurada' : 'No configurada',
      nodeVersion: process.version
    }
  };

  res.status(200).json(testData);
}