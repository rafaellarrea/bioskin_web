/**
 * Adaptador para acceder a los productos de la web desde el backend
 * Lee desde data/products.json (generado desde products.ts)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Productos hardcoded como fallback para Vercel (equipos principales)
 */
const FALLBACK_PRODUCTS = [
  {
    name: "ANALIZADOR FACIAL INTELIGENTE CON PANTALLA DE 21 pulgadas",
    shortDescription: "Sistema profesional para diagnóstico facial con IA, 8 espectros de análisis y reportes automáticos.",
    description: "Equipo avanzado para diagnóstico profesional de piel con inteligencia artificial y sensores de espectro múltiple.",
    details: [
      "Pantalla táctil de 21 pulgadas Full HD",
      "8 tecnologías de imágenes espectrales",
      "Análisis completo de 12 indicadores de piel",
      "Inteligencia Artificial para reconocimiento facial",
      "Emisión de reportes digitales inmediatos"
    ],
    specifications: {
      "Resolución de pantalla": "FHD (touch)",
      "Pixeles": "36 millones de píxeles",
      "Modos de análisis": "8 modos, 12 condiciones"
    },
    indications: ["Diagnóstico integral para cualquier tipo de piel", "INCLUYE GARANTIA DE 6 MESES"],
    price: "",
    stock: {
      available: true,
      quantity: 2,
      location: "Bodega BIOSKIN",
      deliveryTime: "Inmediato"
    },
    images: ["/images/productos/dispositivos/analizador/analizador1.jpg"],
    category: "equipment"
  },
  {
    name: "Láser CO₂ Fraccionado",
    shortDescription: "Sistema de rejuvenecimiento y resurfacing con láser fraccionado de CO₂.",
    description: "Tecnología avanzada para tratamientos de rejuvenecimiento facial y corporal.",
    details: [
      "Láser CO₂ fraccionado de 10.600 nm",
      "Escaneo gráfico de alta velocidad",
      "Múltiples modos de emisión",
      "Aplicaciones faciales, corporales y ginecológicas"
    ],
    specifications: {
      "Longitud de onda": "10.600 nm",
      "Potencia": "30W-40W"
    },
    indications: ["Rejuvenecimiento facial", "Cicatrices de acné", "Estrías"],
    price: "",
    stock: {
      available: true,
      quantity: 1,
      location: "Bodega BIOSKIN",
      deliveryTime: "Inmediato"
    },
    images: ["/images/productos/dispositivos/laser-co2/laser1.jpg"],
    category: "equipment"
  },
  {
    name: "IPL + Nd:YAG 1064/532 + RF Multipolar (3 en 1)",
    shortDescription: "Sistema multifuncional 3 en 1 para depilación, rejuvenecimiento y tratamientos vasculares.",
    description: "Equipo profesional que combina tecnologías IPL, láser Nd:YAG y radiofrecuencia multipolar.",
    details: [
      "IPL para depilación y fotorrejuvenecimiento",
      "Láser Nd:YAG 1064/532 nm para lesiones vasculares",
      "Radiofrecuencia multipolar para flacidez",
      "3 tecnologías en un solo equipo"
    ],
    specifications: {
      "Tecnologías": "IPL + Nd:YAG + RF",
      "Longitudes de onda": "640-1200nm, 1064/532nm"
    },
    indications: ["Depilación definitiva", "Rejuvenecimiento", "Lesiones vasculares", "Flacidez"],
    price: "",
    stock: {
      available: true,
      quantity: 1,
      location: "Bodega BIOSKIN",
      deliveryTime: "Inmediato"
    },
    images: ["/images/productos/dispositivos/ipl-3en1/ipl1.jpg"],
    category: "equipment"
  }
];

/**
 * Lee y parsea el archivo products.json
 * @returns {Array} Array de productos
 */
function loadProducts() {
  try {
    // Intentar cargar desde data/products.json
    const productsPath = path.join(process.cwd(), 'data', 'products.json');
    
    if (fs.existsSync(productsPath)) {
      const fileContent = fs.readFileSync(productsPath, 'utf-8');
      const products = JSON.parse(fileContent);
      console.log(`✅ [ProductsAdapter] ${products.length} productos cargados desde JSON`);
      return products;
    }
    
    // Si no existe el JSON, intentar desde src/data/products.ts (solo en desarrollo)
    const tsPath = path.join(process.cwd(), 'src', 'data', 'products.ts');
    if (fs.existsSync(tsPath)) {
      console.warn('⚠️ [ProductsAdapter] Usando products.ts - ejecutar script de extracción');
      const fileContent = fs.readFileSync(tsPath, 'utf-8');
      const match = fileContent.match(/const products = \[([\s\S]*?)\];\s*export default products;/);
      
      if (match) {
        let jsonContent = match[1]
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/.*/g, '')
          .trim();
        jsonContent = `[${jsonContent}]`;
        const products = eval(`(${jsonContent})`);
        console.log(`✅ [ProductsAdapter] ${products.length} productos cargados desde TS`);
        return products;
      }
    }
    
    // Fallback a productos hardcoded
    console.warn('⚠️ [ProductsAdapter] Usando productos hardcoded como fallback');
    return FALLBACK_PRODUCTS;
    
  } catch (error) {
    console.error('❌ [ProductsAdapter] Error cargando productos:', error.message);
    console.warn('⚠️ [ProductsAdapter] Usando productos hardcoded como fallback');
    return FALLBACK_PRODUCTS;
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
 * Busca productos por palabra clave (búsqueda amplia en toda la info)
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
 * Busca equipos SOLO por nombre y descripción corta (más preciso para consultas técnicas)
 * @param {string} query - Término de búsqueda
 * @returns {Array} Productos que coinciden
 */
export function searchEquipmentByPrimaryInfo(query) {
  if (!query || query.trim().length === 0) {
    return getEquipmentProducts();
  }
  
  const lowerQuery = query.toLowerCase();
  const equipment = getEquipmentProducts();
  
  return equipment.filter(product => {
    // Buscar SOLO en nombre y descripción corta (info principal)
    const primaryInfo = [
      product.name,
      product.shortDescription
    ].join(' ').toLowerCase();
    
    return primaryInfo.includes(lowerQuery);
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
  
  // PASO 1: Extraer keywords técnicos del mensaje
  const technicalKeywords = [
    'hifu', 'láser', 'laser', 'co2', 'fraccionado',
    'analizador', 'facial', 'wood',
    'ipl', 'yag', 'radiofrecuencia', 'rf',
    'plasma', 'pen', 'criolipólisis', 'criolipolisis', 'coolsculpting',
    'cavitación', 'cavitacion',
    'ultrasonido', 'mesoterapia', 'microneedling',
    'dermoabrasión', 'dermoabrasion', 'peeling', 'fotón', 'foton',
    'hydrafacial', 'microdermoabrasion', 'electroporacion'
  ];
  
  const foundKeywords = technicalKeywords.filter(keyword => 
    lowerMsg.includes(keyword)
  );
  
  // PASO 2: Si encontramos keywords técnicos, buscar por ellos
  if (foundKeywords.length > 0) {
    for (const keyword of foundKeywords) {
      // Usar búsqueda más precisa (solo nombre y descripción corta)
      const results = searchEquipmentByPrimaryInfo(keyword);
      if (results.length > 0) {
        // Encontramos el equipo en nuestro catálogo
        return { isUnknownEquipment: false, equipmentName: null };
      }
    }
    
    // Keyword técnico encontrado pero sin resultados = equipo no disponible
    const extractedName = foundKeywords.join(' ');
    return { isUnknownEquipment: true, equipmentName: extractedName };
  }
  
  // PASO 3: Si no hay keywords técnicos, buscar con el mensaje completo
  const found = searchEquipment(message);
  
  if (found.length > 0) {
    return { isUnknownEquipment: false, equipmentName: null };
  }
  
  // PASO 4: Extraer posible nombre de equipo mencionado con patterns
  const equipmentPatterns = [
    /(?:máquina|equipo|dispositivo|aparato|láser|tecnología)\s+(?:de\s+)?([a-záéíóúñ\s]+?)(?:\s+que|\s+para|$)/i,
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
