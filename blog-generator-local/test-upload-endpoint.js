// test-upload-endpoint.js - Prueba el endpoint de upload
const fs = require('fs');
const path = require('path');

// Verificar que el servidor tiene el endpoint configurado
const serverFile = path.join(__dirname, 'server-production.js');
const serverContent = fs.readFileSync(serverFile, 'utf8');

console.log('🔍 Verificando configuración del servidor...');

// Verificar que multer está importado
if (serverContent.includes("require('multer')")) {
    console.log('✅ Multer importado correctamente');
} else {
    console.log('❌ Multer no está importado');
}

// Verificar que el endpoint existe
if (serverContent.includes('/api/upload-image')) {
    console.log('✅ Endpoint /api/upload-image encontrado');
} else {
    console.log('❌ Endpoint /api/upload-image no encontrado');
}

// Verificar configuración de storage
if (serverContent.includes('multer.diskStorage')) {
    console.log('✅ Configuración de storage encontrada');
} else {
    console.log('❌ Configuración de storage no encontrada');
}

// Verificar directorio uploads
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (fs.existsSync(uploadsDir)) {
    console.log('✅ Directorio uploads existe');
} else {
    console.log('❌ Directorio uploads no existe');
    console.log('📁 Creando directorio uploads...');
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Directorio uploads creado');
}

console.log('\n🌐 Para probar el endpoint, el servidor debe estar corriendo en http://localhost:3333');
console.log('📝 El endpoint debe responder a POST /api/upload-image');