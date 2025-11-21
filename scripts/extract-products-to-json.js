/**
 * Script para extraer productos desde products.ts a products.json
 * Ejecutar: node scripts/extract-products-to-json.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_PATH = path.join(process.cwd(), 'src', 'data', 'products.ts');
const DEST_PATH = path.join(process.cwd(), 'data', 'products.json');

console.log('🔍 Extrayendo productos desde products.ts...');
console.log(`📁 Origen: ${SRC_PATH}`);
console.log(`📁 Destino: ${DEST_PATH}`);

try {
  // Leer archivo TypeScript
  const tsContent = fs.readFileSync(SRC_PATH, 'utf-8');
  
  // Extraer array de productos
  const match = tsContent.match(/const products = \[([\s\S]*?)\];\s*export default products;/);
  
  if (!match) {
    throw new Error('No se pudo encontrar el array de productos en el archivo');
  }
  
  // Convertir a JSON válido
  let jsonContent = match[1]
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remover comentarios multilinea
    .replace(/\/\/.*/g, '') // Remover comentarios de línea
    .trim();
  
  // Envolver en array y evaluar
  jsonContent = `[${jsonContent}]`;
  const products = eval(`(${jsonContent})`);
  
  console.log(`✅ ${products.length} productos extraídos exitosamente`);
  
  // Crear directorio si no existe
  const destDir = path.dirname(DEST_PATH);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log(`📁 Directorio creado: ${destDir}`);
  }
  
  // Escribir JSON formateado
  fs.writeFileSync(
    DEST_PATH, 
    JSON.stringify(products, null, 2), 
    'utf-8'
  );
  
  console.log(`✅ Archivo JSON generado exitosamente: ${DEST_PATH}`);
  console.log(`📊 Estadísticas:`);
  
  const stats = {
    total: products.length,
    equipment: products.filter(p => p.category === 'equipment').length,
    cosmetic: products.filter(p => p.category === 'cosmetic').length,
    inStock: products.filter(p => p.stock?.available === true).length
  };
  
  console.log(`   - Total productos: ${stats.total}`);
  console.log(`   - Equipamiento: ${stats.equipment}`);
  console.log(`   - Cosméticos: ${stats.cosmetic}`);
  console.log(`   - Disponibles en stock: ${stats.inStock}`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
