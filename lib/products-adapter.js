/**
 * Adaptador para acceder a los productos de la web desde el backend
 * Lee directamente desde src/data/products.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Lee y parsea el archivo products.ts
 * @returns {Array} Array de productos
 */
function loadProducts() {
  try {
    const productsPath = path.join(process.cwd(), 'src', 'data', 'products.ts');
    const fileContent = fs.readFileSync(productsPath, 'utf-8');
    
    // Extraer el contenido del array (entre const products = [ y ];)
    const match = fileContent.match(/const products = \[([\s\S]*?)\];\s*export default products;/);
    
    if (!match) {
      console.error('❌ No se pudo extraer el array de productos');
      return [];
    }
    
    // Convertir a JSON válido (remover comentarios y arreglar formato)
    let jsonContent = match[1]
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remover comentarios multilinea
      .replace(/\/\/.*/g, '') // Remover comentarios de línea
      .trim();
    
    // Envolver en array válido
    jsonContent = `[${jsonContent}]`;
    
    // Parsear con eval en contexto seguro (solo para desarrollo)
    // En producción esto ya estará pre-parseado
    const products = eval(`(${jsonContent})`);
    
    console.log(`✅ [ProductsAdapter] ${products.length} productos cargados`);
    return products;
    
  } catch (error) {
    console.error('❌ [ProductsAdapter] Error cargando productos:', error.message);
    return [];
  }
}

// Cache de productos
let productsCache = null;

/**
 * Obtiene todos los productos
 * @returns {Array} Array de productos
 */
export function getAllProducts() {
  if (!productsCache) {
    productsCache = loadProducts();
  }
  return productsCache;
}

/**
 * Obtiene solo productos de equipamiento médico
 * @returns {Array} Array de productos equipment
 */
export function getEquipmentProducts() {
  const products = getAllProducts();
  return products.filter(p => p.category === 'equipment');
}

/**
 * Obtiene productos con stock disponible
 * @returns {Array} Array de productos con stock
 */
export function getProductsInStock() {
  const equipment = getEquipmentProducts();
  return equipment.filter(p => p.stock?.available === true);
}

/**
 * Busca productos por palabra clave
 * @param {string} query - Término de búsqueda
 * @returns {Array} Productos que coinciden
 */
export function searchEquipment(query) {
  if (!query || query.trim().length === 0) {
    return getEquipmentProducts();
  }
  
  const lowerQuery = query.toLowerCase();
  const equipment = getEquipmentProducts();
  
  return equipment.filter(product => {
    const searchableText = [
      product.name,
      product.shortDescription,
      product.description,
      ...product.details,
      ...Object.values(product.specifications || {}),
      ...product.indications
    ].join(' ').toLowerCase();
    
    return searchableText.includes(lowerQuery);
  });
}

/**
 * Busca un producto específico por nombre aproximado
 * @param {string} name - Nombre del producto
 * @returns {Object|null} Producto encontrado o null
 */
export function findEquipmentByName(name) {
  const lowerName = name.toLowerCase();
  const equipment = getEquipmentProducts();
  
  // Búsqueda exacta
  let found = equipment.find(p => p.name.toLowerCase().includes(lowerName));
  
  // Búsqueda por keywords
  if (!found) {
    const keywords = {
      'hifu': ['hifu', '7d', 'ultrasonido'],
      'laser': ['láser', 'laser', 'co2', 'fraccionado'],
      'analizador': ['analizador', 'facial', 'wood'],
      'ipl': ['ipl', 'yag', 'radiofrecuencia', '3 en 1', 'multifuncional']
    };
    
    for (const [key, terms] of Object.entries(keywords)) {
      if (terms.some(term => lowerName.includes(term))) {
        found = equipment.find(p => 
          terms.some(term => p.name.toLowerCase().includes(term))
        );
        if (found) break;
      }
    }
  }
  
  return found || null;
}

/**
 * Obtiene información de stock de un producto
 * @param {string} productName - Nombre del producto
 * @returns {Object|null} Info de stock o null
 */
export function getStockInfo(productName) {
  const product = findEquipmentByName(productName);
  return product?.stock || null;
}

/**
 * Formatea información de un producto para el chatbot
 * @param {Object} product - Producto
 * @param {boolean} includeStock - Incluir info de stock
 * @returns {string} Texto formateado
 */
export function formatProductForChat(product, includeStock = true) {
  let text = `🔧 *${product.name}*\n\n`;
  text += `📋 ${product.shortDescription}\n\n`;
  
  if (includeStock && product.stock) {
    const stock = product.stock;
    if (stock.available) {
      text += `✅ *Stock disponible*: ${stock.quantity} unidad${stock.quantity > 1 ? 'es' : ''}\n`;
      text += `📍 Ubicación: ${stock.location}\n`;
      text += `🚚 Entrega: ${stock.deliveryTime}\n\n`;
    } else {
      text += `⚠️ Actualmente sin stock\n`;
      if (stock.deliveryTime) {
        text += `🚚 Tiempo de importación: ${stock.deliveryTime}\n\n`;
      }
    }
  }
  
  // Detalles principales (primeros 3)
  if (product.details && product.details.length > 0) {
    text += `*Características principales:*\n`;
    product.details.slice(0, 3).forEach(detail => {
      text += `• ${detail}\n`;
    });
    text += `\n`;
  }
  
  return text;
}

/**
 * Genera listado resumido de equipos en stock
 * @returns {string} Texto formateado
 */
export function getStockListForChat() {
  const inStock = getProductsInStock();
  
  if (inStock.length === 0) {
    return '⚠️ Actualmente no tenemos equipos en stock inmediato.';
  }
  
  let text = `🏥 *Equipos disponibles en stock:*\n\n`;
  
  inStock.forEach((product, idx) => {
    text += `${idx + 1}. *${product.name}*\n`;
    text += `   📦 Stock: ${product.stock.quantity} unidad${product.stock.quantity > 1 ? 'es' : ''}\n`;
    text += `   💡 ${product.shortDescription.substring(0, 80)}...\n\n`;
  });
  
  return text;
}

/**
 * Detecta si un equipo mencionado NO está en el catálogo
 * @param {string} message - Mensaje del usuario
 * @returns {Object} { isUnknownEquipment: boolean, equipmentName: string|null }
 */
export function detectUnknownEquipment(message) {
  const lowerMsg = message.toLowerCase();
  
  // Palabras que indican que es consulta por equipo
  const equipmentIndicators = /(equipo|dispositivo|aparato|máquina|láser|tecnología)/i;
  
  if (!equipmentIndicators.test(message)) {
    return { isUnknownEquipment: false, equipmentName: null };
  }
  
  // Buscar en nuestro catálogo
  const found = searchEquipment(message);
  
  if (found.length > 0) {
    return { isUnknownEquipment: false, equipmentName: null };
  }
  
  // Extraer posible nombre de equipo mencionado
  const equipmentPatterns = [
    /(?:equipo|dispositivo|aparato|láser|tecnología)\s+(?:de\s+)?([a-záéíóúñ\s]+)/i,
    /([a-záéíóúñ]+)\s+(?:equipo|dispositivo|aparato)/i
  ];
  
  let equipmentName = null;
  for (const pattern of equipmentPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      equipmentName = match[1].trim();
      break;
    }
  }
  
  return { isUnknownEquipment: true, equipmentName };
}
