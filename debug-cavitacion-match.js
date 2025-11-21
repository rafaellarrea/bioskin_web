/**
 * Ver qué producto está coincidiendo con "cavitación"
 */

import { searchEquipment } from './lib/products-adapter.js';

console.log('\n🔍 ¿Qué producto contiene "cavitación"?\n');

const results = searchEquipment('cavitación');
console.log(`Resultados encontrados: ${results.length}\n`);

results.forEach((product, idx) => {
  console.log(`${idx + 1}. ${product.name}`);
  console.log(`   Descripción corta: ${product.shortDescription.substring(0, 100)}...`);
  
  // Buscar dónde aparece la palabra
  const allText = [
    product.name,
    product.shortDescription,
    product.description,
    ...product.details,
    ...Object.values(product.specifications || {}),
    ...product.indications
  ].join(' ').toLowerCase();
  
  if (allText.includes('cavit')) {
    console.log(`   ✅ Contiene "cavit" en alguna parte`);
  }
  if (allText.includes('ultrason')) {
    console.log(`   ✅ Contiene "ultrason" en alguna parte`);
  }
  
  console.log('');
});
