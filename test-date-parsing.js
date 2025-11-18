/**
 * Test de parseado de fechas naturales
 * 
 * Ejecutar: node test-date-parsing.js
 */

import { parseNaturalDate } from './lib/chatbot-appointment-service.js';

console.log('🧪 TESTING PARSEADO DE FECHAS NATURALES\n');
console.log('=' .repeat(60));

const testCases = [
  // Formato "hoy"
  { input: 'hoy', expected: 'hoy' },
  
  // Formato "mañana"
  { input: 'mañana', expected: 'mañana (19 nov)' },
  { input: 'Mañana', expected: 'mañana (19 nov)' },
  
  // Formato "pasado mañana"
  { input: 'pasado mañana', expected: 'pasado mañana (20 nov)' },
  
  // Días de la semana
  { input: 'lunes', expected: 'próximo lunes' },
  { input: 'viernes', expected: 'próximo viernes' },
  { input: 'el viernes', expected: 'próximo viernes' },
  
  // Formato "DD de NOMBREMES" (CRÍTICO)
  { input: '19 de noviembre', expected: '2025-11-19' },
  { input: '20 de noviembre', expected: '2025-11-20' },
  { input: '15 de diciembre', expected: '2025-12-15' },
  { input: '1 de enero', expected: '2025-01-01' },
  
  // Formato "DD de NOMBREMES de YYYY"
  { input: '25 de diciembre de 2025', expected: '2025-12-25' },
  
  // Formato DD/MM
  { input: '19/11', expected: '2025-11-19' },
  { input: '20/11', expected: '2025-11-20' },
  { input: '15/12', expected: '2025-12-15' },
  
  // Formato ISO
  { input: '2025-11-19', expected: '2025-11-19' },
  
  // Casos que NO deben funcionar
  { input: 'algún día', expected: null },
  { input: 'no sé', expected: null },
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  console.log(`\nTest ${index + 1}: "${test.input}"`);
  const result = parseNaturalDate(test.input);
  
  if (result) {
    console.log(`✅ Parseado como: ${result}`);
    if (test.expected === null) {
      console.log(`❌ FALLO: Se esperaba null pero se obtuvo ${result}`);
      failed++;
    } else {
      console.log(`💡 Esperado: ${test.expected}`);
      passed++;
    }
  } else {
    console.log(`❌ No se pudo parsear`);
    if (test.expected === null) {
      console.log(`✅ CORRECTO: Se esperaba null`);
      passed++;
    } else {
      console.log(`❌ FALLO: Se esperaba ${test.expected}`);
      failed++;
    }
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 RESULTADOS: ${passed} pasados, ${failed} fallidos`);
console.log(`${failed === 0 ? '✅ TODOS LOS TESTS PASARON' : '❌ ALGUNOS TESTS FALLARON'}\n`);
