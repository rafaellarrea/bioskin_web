/**
 * Test completo de detección de equipos conocidos/desconocidos
 */

import { detectUnknownEquipment } from './lib/products-adapter.js';

const testCases = [
  {
    name: "HIFU (conocido)",
    message: "Necesito información sobre la máquina de HIFU que están ofertando",
    expectedUnknown: false
  },
  {
    name: "Láser CO2 (conocido)",
    message: "¿Tienen disponible el láser CO2 fraccionado?",
    expectedUnknown: false
  },
  {
    name: "Analizador facial (conocido)",
    message: "Quiero información del analizador facial de 21 pulgadas",
    expectedUnknown: false
  },
  {
    name: "IPL (conocido)",
    message: "Me interesa el equipo IPL para depilación",
    expectedUnknown: false
  },
  {
    name: "Criolipólisis (desconocido)",
    message: "¿Tienen máquina de criolipólisis coolsculpting?",
    expectedUnknown: true
  },
  {
    name: "Cavitación (desconocido)",
    message: "Necesito un equipo de cavitación ultrasónica",
    expectedUnknown: true
  },
  {
    name: "Consulta no técnica",
    message: "¿Cuál es el horario de atención?",
    expectedUnknown: false  // No es consulta de equipo
  }
];

console.log('\n🧪 TEST SUITE: Detección de Equipos\n');
console.log('='.repeat(70));

let passed = 0;
let failed = 0;

testCases.forEach((test, idx) => {
  console.log(`\nTest ${idx + 1}: ${test.name}`);
  console.log(`Mensaje: "${test.message}"`);
  
  const result = detectUnknownEquipment(test.message);
  const success = result.isUnknownEquipment === test.expectedUnknown;
  
  console.log(`Resultado: ${result.isUnknownEquipment ? '❌ Desconocido' : '✅ Conocido'}`);
  console.log(`Esperado: ${test.expectedUnknown ? '❌ Desconocido' : '✅ Conocido'}`);
  
  if (result.equipmentName) {
    console.log(`Nombre extraído: "${result.equipmentName}"`);
  }
  
  if (success) {
    console.log('✅ PASS');
    passed++;
  } else {
    console.log('❌ FAIL');
    failed++;
  }
});

console.log('\n' + '='.repeat(70));
console.log(`\n📊 Resultados: ${passed}/${testCases.length} tests pasados`);

if (failed === 0) {
  console.log('✅ Todos los tests pasaron exitosamente\n');
} else {
  console.log(`⚠️ ${failed} tests fallaron\n`);
}
