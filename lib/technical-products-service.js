/**
 * SERVICIO DE PRODUCTOS TÉCNICOS - BIOSKIN
 * 
 * Maneja consultas sobre equipos médicos estéticos:
 * - Búsqueda de productos
 * - Información de stock (simulado - conectar con sistema real)
 * - Especificaciones técnicas
 * - Precios y cotizaciones
 */

// Catálogo de productos técnicos (equipos médicos estéticos)
// En producción, esto vendría de una base de datos
const TECHNICAL_PRODUCTS = [
  {
    id: 'ANAL-001',
    name: 'ANALIZADOR FACIAL INTELIGENTE',
    model: 'Analizador 21"',
    category: 'diagnostico',
    price: 0, // Consultar
    stock: 2,
    location: 'Bodega Principal',
    shortDescription: 'Sistema profesional para diagnóstico facial con IA, 8 espectros de análisis',
    specifications: {
      pantalla: '21 pulgadas Full HD táctil',
      pixeles: '36 millones',
      modos: '8 modos de análisis, 12 condiciones detectables',
      iluminacion: "Wood's light, RGB, UV (365nm), PL",
      conectividad: 'WiFi, USB',
      garantia: '6 meses'
    },
    keywords: ['analizador', 'facial', 'diagnostico', 'escaner', 'ia', 'inteligencia artificial', 'wood', 'uv']
  },
  {
    id: 'LASER-001',
    name: 'LÁSER CO₂ FRACCIONADO',
    model: 'MSLCF10',
    category: 'laser',
    price: 0, // Consultar
    stock: 1,
    location: 'Bodega Principal',
    shortDescription: 'Sistema de rejuvenecimiento con láser fraccionado CO₂ de 10.600 nm',
    specifications: {
      longitud: '10.600 nm',
      potencia: '1-60W',
      modos: 'Continuo, pulso único, intermitente, super pulso',
      escaneo: 'Aleatorio, Secuencial, MidSplit',
      formas: 'Cuadrado, círculo, triángulo, hexágono, línea',
      refrigeracion: 'Circulación de agua',
      peso: '31 kg'
    },
    keywords: ['laser', 'co2', 'fraccionado', 'rejuvenecimiento', 'cicatrices', 'arrugas', 'vaginal']
  },
  {
    id: 'HIFU-001',
    name: 'HIFU 7D DOBLE MANIJA',
    model: 'HIFU 7D',
    category: 'ultrasonido',
    price: 0, // Consultar
    stock: 3,
    location: 'Bodega A',
    shortDescription: 'HIFU de ultrasonido focalizado macro y micro para lifting facial sin cirugía',
    specifications: {
      energia: '0.1~3J ajustable',
      frecuencia: '5.5 MHz (ocular), 2.0 MHz (corporal)',
      profundidades: '1.5mm, 2.0mm, 3.0mm, 4.5mm, 6.0mm, 9.0mm, 13.0mm',
      cartuchos: '7 cartuchos incluidos',
      modos: 'Single / Repeat',
      certificaciones: 'KFDA, CE'
    },
    keywords: ['hifu', 'ultrasonido', 'lifting', 'facial', 'reafirmacion', 'arrugas', 'papada', 'corporal']
  },
  {
    id: 'MULTI-001',
    name: '3 EN 1 IPL + LASER YAG + RF',
    model: 'IPL-YAG-RF Pro',
    category: 'multifuncional',
    price: 0, // Consultar
    stock: 1,
    location: 'Bodega Principal',
    shortDescription: 'Plataforma estética: depilación IPL, remoción tatuajes, RF rejuvenecimiento',
    specifications: {
      ipl: 'Depilación permanente, manchas, rosácea',
      ndyag: 'Eliminación tatuajes multicolor',
      rf: 'Lifting facial no invasivo',
      disparos: '300,000 garantizados',
      enfriamiento: 'Sistema por zafiro'
    },
    keywords: ['ipl', 'yag', 'radiofrecuencia', 'depilacion', 'tatuajes', 'multifuncional', 'laser', 'nd yag']
  }
];

/**
 * Busca productos por query de texto libre
 * Usa coincidencia fuzzy con keywords, nombre, modelo, categoría
 */
export function searchProducts(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();
  const words = searchTerm.split(/\s+/);

  const results = TECHNICAL_PRODUCTS.map(product => {
    let score = 0;

    // Buscar en nombre
    if (product.name.toLowerCase().includes(searchTerm)) score += 10;
    
    // Buscar en modelo
    if (product.model.toLowerCase().includes(searchTerm)) score += 8;
    
    // Buscar en categoría
    if (product.category.toLowerCase().includes(searchTerm)) score += 5;
    
    // Buscar en keywords
    product.keywords.forEach(keyword => {
      if (keyword.includes(searchTerm)) score += 7;
      words.forEach(word => {
        if (word.length > 2 && keyword.includes(word)) score += 3;
      });
    });

    // Buscar en shortDescription
    if (product.shortDescription.toLowerCase().includes(searchTerm)) score += 4;

    return { ...product, score };
  })
  .filter(p => p.score > 0)
  .sort((a, b) => b.score - a.score);

  console.log(`🔍 [TechnicalProducts] Búsqueda "${query}": ${results.length} resultados`);
  
  return results.slice(0, 5); // Top 5 resultados
}

/**
 * Obtiene producto por ID o modelo exacto
 */
export function getProductByModel(modelOrId) {
  const search = modelOrId.toLowerCase();
  const product = TECHNICAL_PRODUCTS.find(p => 
    p.id.toLowerCase() === search || 
    p.model.toLowerCase() === search ||
    p.name.toLowerCase() === search
  );

  if (product) {
    console.log(`✅ [TechnicalProducts] Producto encontrado: ${product.name}`);
  } else {
    console.log(`❌ [TechnicalProducts] Producto no encontrado: ${modelOrId}`);
  }

  return product || null;
}

/**
 * Consulta stock de un producto
 * En producción conectar con sistema de inventario real
 */
export function checkStock(productId) {
  const product = TECHNICAL_PRODUCTS.find(p => p.id === productId);
  
  if (!product) {
    return {
      available: false,
      quantity: 0,
      message: 'Producto no encontrado'
    };
  }

  return {
    available: product.stock > 0,
    quantity: product.stock,
    location: product.location,
    productName: product.name,
    model: product.model,
    message: product.stock > 0 
      ? `${product.stock} unidad${product.stock > 1 ? 'es' : ''} disponible${product.stock > 1 ? 's' : ''} en ${product.location}`
      : 'Sin stock disponible. Consultar tiempo de entrega.'
  };
}

/**
 * Obtiene todas las categorías disponibles
 */
export function getCategories() {
  const categories = [...new Set(TECHNICAL_PRODUCTS.map(p => p.category))];
  return categories;
}

/**
 * Obtiene productos por categoría
 */
export function getProductsByCategory(category) {
  const results = TECHNICAL_PRODUCTS.filter(p => 
    p.category.toLowerCase() === category.toLowerCase()
  );
  
  console.log(`📂 [TechnicalProducts] Categoría "${category}": ${results.length} productos`);
  return results;
}

/**
 * Formatea información de producto para mostrar al usuario
 */
export function formatProductInfo(product, includeStock = true) {
  let info = `📦 *${product.name}*\n`;
  info += `Modelo: ${product.model}\n`;
  info += `${product.shortDescription}\n\n`;

  if (includeStock) {
    const stockInfo = checkStock(product.id);
    info += `📊 Stock: ${stockInfo.message}\n`;
  }

  if (product.price > 0) {
    info += `💵 Precio: $${product.price} USD\n`;
  } else {
    info += `💵 Precio: Consultar cotización\n`;
  }

  return info;
}

/**
 * Formatea especificaciones técnicas
 */
export function formatSpecifications(product) {
  let specs = `🔧 *Especificaciones Técnicas - ${product.name}*\n\n`;
  
  Object.entries(product.specifications).forEach(([key, value]) => {
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    specs += `• ${label}: ${value}\n`;
  });

  return specs;
}

/**
 * Genera resumen de catálogo completo para IA
 */
export function generateCatalogSummary() {
  let summary = '📋 CATÁLOGO DE EQUIPOS MÉDICOS ESTÉTICOS BIOSKIN:\n\n';
  
  TECHNICAL_PRODUCTS.forEach(product => {
    summary += `• ${product.name} (${product.model})\n`;
    summary += `  ${product.shortDescription}\n`;
    summary += `  Stock: ${product.stock} unidades\n`;
    summary += `  Keywords: ${product.keywords.slice(0, 5).join(', ')}\n\n`;
  });

  return summary;
}
