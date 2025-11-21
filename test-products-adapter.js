/**
 * Test rápido del products-adapter.js
 */

import { 
  getAllProducts, 
  getEquipmentProducts,
  getProductsInStock,
  searchEquipment,
  findEquipmentByName,
  detectUnknownEquipment
} from './lib/products-adapter.js';

console.log('\n🧪 TEST PRODUCTS ADAPTER\n');

// Test 1: Cargar todos los productos
console.log('📦 Test 1: Cargar todos los productos');
const allProducts = getAllProducts();
console.log(`   Resultado: ${allProducts.length} productos cargados`);
console.log(`   Nombres: ${allProducts.map(p => p.name.substring(0, 40)).join(', ')}\n`);

// Test 2: Solo equipamiento
console.log('🔧 Test 2: Filtrar equipamiento');
const equipment = getEquipmentProducts();
console.log(`   Resultado: ${equipment.length} equipos encontrados\n`);

// Test 3: Stock disponible
console.log('📊 Test 3: Productos con stock');
const inStock = getProductsInStock();
console.log(`   Resultado: ${inStock.length} equipos en stock`);
inStock.forEach(p => {
  console.log(`   - ${p.name}: ${p.stock.quantity} unidad(es)`);
});

// Test 4: Búsqueda por keyword
console.log('\n🔍 Test 4: Buscar "HIFU"');
const hifuResults = searchEquipment('HIFU');
console.log(`   Resultado: ${hifuResults.length} equipos encontrados`);
if (hifuResults.length > 0) {
  console.log(`   Primera coincidencia: ${hifuResults[0].name}`);
}

// Test 5: Buscar por nombre exacto
console.log('\n🎯 Test 5: Encontrar "analizador"');
const analizador = findEquipmentByName('analizador');
console.log(`   Resultado: ${analizador ? analizador.name : 'No encontrado'}`);

// Test 6: Detectar equipo desconocido
console.log('\n⚠️ Test 6: Detectar equipo no disponible');
const unknownCheck = detectUnknownEquipment('Necesito información sobre la máquina de HIFU');
console.log(`   ¿Es desconocido?: ${unknownCheck.isUnknownEquipment}`);
console.log(`   Nombre detectado: ${unknownCheck.equipmentName}`);

// Test 7: Detectar equipo conocido
console.log('\n✅ Test 7: Detectar equipo conocido (Analizador)');
const knownCheck = detectUnknownEquipment('Quiero el Analizador Facial');
console.log(`   ¿Es desconocido?: ${knownCheck.isUnknownEquipment}`);

console.log('\n✅ Tests completados\n');
