/**
 * Debug específico de cavitación
 */

import { searchEquipment, detectUnknownEquipment } from './lib/products-adapter.js';

const message = "Necesito un equipo de cavitación ultrasónica";
const lowerMsg = message.toLowerCase();

console.log('\n🔍 DEBUG: Cavitación Detection\n');
console.log(`Mensaje: "${message}"\n`);

// Check 1: ¿Contiene "cavitación"?
console.log(`¿Contiene "cavitación"? ${lowerMsg.includes('cavitación')}`);
console.log(`¿Contiene "cavitacion"? ${lowerMsg.includes('cavitacion')}`);

// Check 2: ¿Qué devuelve searchEquipment?
console.log(`\nsearchEquipment("cavitación"):`);
const result1 = searchEquipment('cavitación');
console.log(`  Resultados: ${result1.length}`);

console.log(`\nsearchEquipment("cavitacion"):`);
const result2 = searchEquipment('cavitacion');
console.log(`  Resultados: ${result2.length}`);

console.log(`\nsearchEquipment("ultrasonido"):`);
const result3 = searchEquipment('ultrasonido');
console.log(`  Resultados: ${result3.length}`);

// Check 3: ¿Qué devuelve detectUnknownEquipment?
console.log(`\ndetectUnknownEquipment(mensaje):`);
const detection = detectUnknownEquipment(message);
console.log(`  isUnknownEquipment: ${detection.isUnknownEquipment}`);
console.log(`  equipmentName: ${detection.equipmentName}`);

console.log('\n');
