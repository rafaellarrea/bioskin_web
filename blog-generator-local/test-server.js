// test-server.js - Servidor de prueba mínimo
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3333;

console.log('🚀 Iniciando servidor de prueba...');

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>BIOSKIN Blog Generator - Prueba</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 800px; 
                margin: 50px auto; 
                padding: 20px;
                background: #f5f5f5;
            }
            .card {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
            }
            .success { color: #28a745; }
            .info { color: #007bff; }
            button {
                background: #deb887;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                margin: 10px;
            }
            button:hover { background: #b8860b; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>🎉 BIOSKIN Blog Generator</h1>
            <h2 class="success">✅ Servidor Funcionando</h2>
            <p class="info">Puerto: ${PORT}</p>
            <p>El servidor está ejecutándose correctamente.</p>
            
            <h3>🔧 Estado del Sistema</h3>
            <p><strong>Node.js:</strong> ${process.version}</p>
            <p><strong>Directorio:</strong> ${__dirname}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
            
            <h3>📝 Próximos pasos</h3>
            <ol style="text-align: left;">
                <li>Verificar que todas las dependencias estén instaladas</li>
                <li>Configurar la API key de OpenAI en .env</li>
                <li>Probar la funcionalidad de generación de blogs</li>
                <li>Implementar la gestión de imágenes</li>
                <li>Configurar el despliegue automático</li>
            </ol>
            
            <button onclick="location.reload()">🔄 Refrescar</button>
            <button onclick="testApi()">🧪 Probar API</button>
        </div>

        <script>
            function testApi() {
                fetch('/api/test')
                    .then(r => r.json())
                    .then(data => alert('API Response: ' + JSON.stringify(data)))
                    .catch(e => alert('Error: ' + e.message));
            }
        </script>
    </body>
    </html>
  `);
});

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    server: 'BIOSKIN Blog Generator Local'
  });
});

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║        BIOSKIN BLOG GENERATOR          ║
  ║           SERVIDOR DE PRUEBA           ║
  ╠════════════════════════════════════════╣
  ║  🌐 URL: http://localhost:${PORT}         ║
  ║  ✅ Estado: FUNCIONANDO               ║
  ║  📁 Directorio: ${__dirname.split('\\').pop()}        ║
  ╚════════════════════════════════════════╝
  
  ✅ Servidor iniciado correctamente
  🌐 Abre: http://localhost:${PORT}
  `);
});