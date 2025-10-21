// test-api-functions.js
// Script para probar las funciones API localmente

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing API Functions...\n');

// Test 1: Probar importación del módulo de generación de temas
try {
  console.log('📋 Testing generate-topics module import...');
  const generateTopics = require('./api/ai-blog/generate-topics.js');
  console.log('✅ generate-topics module imported successfully');
  console.log('Type:', typeof generateTopics);
} catch (error) {
  console.error('❌ Error importing generate-topics:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test 2: Probar importación del módulo de generación de blogs
try {
  console.log('📝 Testing generate-production module import...');
  const generateProduction = require('./api/ai-blog/generate-production.js');
  console.log('✅ generate-production module imported successfully');
  console.log('Type:', typeof generateProduction);
} catch (error) {
  console.error('❌ Error importing generate-production:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test 3: Probar importación del módulo de búsqueda de imágenes
try {
  console.log('🖼️ Testing real-image-search module import...');
  const imageSearch = require('./lib/real-image-search.js');
  console.log('✅ real-image-search module imported successfully');
  console.log('Available functions:', Object.keys(imageSearch));
} catch (error) {
  console.error('❌ Error importing real-image-search:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test 4: Verificar archivos existentes
const filesToCheck = [
  './api/ai-blog/generate-topics.js',
  './api/ai-blog/generate-production.js',
  './lib/real-image-search.js'
];

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ File exists: ${file}`);
  } else {
    console.log(`❌ File missing: ${file}`);
  }
});

console.log('\n🔍 Testing completed!');