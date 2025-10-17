// api/ai-blog/test-endpoint.js
// Endpoint simple de prueba

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Método no permitido. Use GET.'
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Endpoint de prueba funcionando',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
}