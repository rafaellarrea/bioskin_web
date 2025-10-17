// api/debug.js
// Endpoint de debug en la raíz para probar Vercel routing

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  return res.status(200).json({
    success: true,
    message: 'Debug endpoint funcionando',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers
  });
}