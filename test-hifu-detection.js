/**
 * Test específico para la búsqueda de HIFU
 */

import { 
  searchEquipment,
  findEquipmentByName,
  detectUnknownEquipment
} from './lib/products-adapter.js';

const userMessage = "Necesito información sobre la máquina de HIFU que están ofertando";

console.log('\n🧪 TEST ESPECÍFICO: Búsqueda de HIFU\n');
console.log(`Mensaje del usuario: "${userMessage}"\n`);

// Test 1: searchEquipment
console.log('📋 Test 1: searchEquipment("HIFU")');
const search1 = searchEquipment('HIFU');
console.log(`   Resultados: ${search1.length}`);
if (search1.length > 0) {
  console.log(`   ✅ Encontrado: ${search1[0].name}`);
} else {
  console.log(`   ❌ No encontrado`);
}

// Test 2: searchEquipment con mensaje completo
console.log('\n📋 Test 2: searchEquipment(mensaje_completo)');
const search2 = searchEquipment(userMessage);
console.log(`   Resultados: ${search2.length}`);
if (search2.length > 0) {
  console.log(`   ✅ Encontrado: ${search2[0].name}`);
} else {
  console.log(`   ❌ No encontrado`);
}

// Test 3: findEquipmentByName
console.log('\n🎯 Test 3: findEquipmentByName("HIFU")');
const find1 = findEquipmentByName('HIFU');
if (find1) {
  console.log(`   ✅ Encontrado: ${find1.name}`);
} else {
  console.log(`   ❌ No encontrado`);
}

// Test 4: detectUnknownEquipment (PROBLEMA)
console.log('\n⚠️ Test 4: detectUnknownEquipment(mensaje_completo)');
const unknown = detectUnknownEquipment(userMessage);
console.log(`   ¿Es desconocido?: ${unknown.isUnknownEquipment}`);
console.log(`   Nombre detectado: ${unknown.equipmentName}`);

if (unknown.isUnknownEquipment) {
  console.log('\n❌ PROBLEMA IDENTIFICADO: detectUnknownEquipment marca HIFU como desconocido');
  console.log('   Posible causa: La función no está usando searchEquipment correctamente');
}

console.log('\n✅ Análisis completado\n');
