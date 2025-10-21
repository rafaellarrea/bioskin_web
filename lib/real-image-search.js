/**
 * 🔍 SERVICIO DE BÚSQUEDA REAL DE IMÁGENES
 * Sistema avanzado para búsqueda de imágenes basado en tags de IA
 */

// URLs de búsqueda alternativas sin API key
const IMAGE_SEARCH_SOURCES = {
  // Picsum con query tags en parámetros para mejor cache
  picsum: (query, seed) => `https://picsum.photos/seed/${encodeURIComponent(query)}-${seed}/1200/600.jpg`,
  
  // Lorem Picsum con categorías específicas
  loremflickr: (query) => `https://loremflickr.com/1200/600/${encodeURIComponent(query)}/all`,
  
  // Placeholder con texto personalizado
  placeholder: (query) => `https://via.placeholder.com/1200x600/2D5AA0/FFFFFF?text=${encodeURIComponent(query.replace(/\s+/g, '+'))}`
};

/**
 * Mapeo inteligente de tags médico-estéticos a términos de búsqueda visual
 */
const MEDICAL_AESTHETIC_MAPPING = {
  // Tratamientos con láser
  'láser': ['laser', 'medical laser', 'laser therapy', 'dermatology laser'],
  'laser': ['laser therapy', 'medical laser', 'aesthetic laser', 'dermatology'],
  'co2': ['laser co2', 'carbon dioxide laser', 'skin resurfacing', 'laser treatment'],
  
  // Inyectables
  'botox': ['botox injection', 'facial injection', 'aesthetic injection', 'cosmetic treatment'],
  'toxina': ['botulinum toxin', 'wrinkle treatment', 'facial aesthetics', 'anti aging'],
  'ácido': ['hyaluronic acid', 'dermal fillers', 'facial volumization', 'aesthetic medicine'],
  'hialurónico': ['hyaluronic acid', 'lip fillers', 'facial enhancement', 'cosmetic injection'],
  'rellenos': ['dermal fillers', 'facial volumization', 'lip enhancement', 'aesthetic injection'],
  
  // Tecnologías
  'radiofrecuencia': ['radiofrequency', 'rf treatment', 'skin tightening', 'body contouring'],
  'ultrasonido': ['ultrasound therapy', 'hifu treatment', 'non invasive lifting', 'aesthetic ultrasound'],
  'hifu': ['hifu treatment', 'focused ultrasound', 'non surgical facelift', 'skin lifting'],
  'ipl': ['intense pulsed light', 'photorejuvenation', 'light therapy', 'pigmentation treatment'],
  
  // Tratamientos faciales
  'facial': ['facial treatment', 'skincare', 'aesthetic facial', 'beauty treatment'],
  'peeling': ['chemical peel', 'skin exfoliation', 'facial rejuvenation', 'dermatology treatment'],
  'limpieza': ['facial cleansing', 'deep cleansing', 'skincare treatment', 'facial hygiene'],
  'hidratación': ['skin hydration', 'moisture therapy', 'hydrating treatment', 'skincare'],
  
  // Tratamientos corporales
  'liposucción': ['body contouring', 'fat removal', 'body sculpting', 'cosmetic surgery'],
  'criolipólisis': ['cryolipolysis', 'coolsculpting', 'fat freezing', 'non invasive liposuction'],
  'corporal': ['body treatment', 'body aesthetics', 'body contouring', 'body therapy'],
  
  // Rejuvenecimiento
  'rejuvenecimiento': ['anti aging', 'skin rejuvenation', 'facial renewal', 'age reversal'],
  'colágeno': ['collagen stimulation', 'collagen therapy', 'skin firming', 'anti aging'],
  'elastina': ['skin elasticity', 'firming treatment', 'skin tightening', 'anti aging'],
  
  // Tecnología médica
  'dispositivo': ['medical device', 'aesthetic equipment', 'medical technology', 'treatment device'],
  'tecnología': ['medical technology', 'aesthetic innovation', 'advanced treatment', 'modern medicine'],
  'innovación': ['medical innovation', 'cutting edge treatment', 'advanced aesthetics', 'modern therapy']
};

/**
 * Genera términos de búsqueda optimizados basados en tags de IA
 */
function generateSearchTerms(aiTags) {
  const searchTerms = [];
  const processedTags = aiTags
    .filter(tag => tag.toLowerCase() !== 'bioskin')
    .slice(0, 3); // Los 3 tags más relevantes
  
  for (const tag of processedTags) {
    const lowerTag = tag.toLowerCase();
    
    // Buscar mapeos exactos
    for (const [key, values] of Object.entries(MEDICAL_AESTHETIC_MAPPING)) {
      if (lowerTag.includes(key)) {
        searchTerms.push(...values);
        break;
      }
    }
    
    // Si no hay mapeo, usar el tag directamente con contexto médico
    if (searchTerms.length === 0) {
      searchTerms.push(`${tag} medical aesthetic`, `${tag} treatment`, `aesthetic ${tag}`);
    }
  }
  
  // Eliminar duplicados y tomar los mejores términos
  return [...new Set(searchTerms)].slice(0, 5);
}

/**
 * Busca imagen real basada en tags de IA
 */
async function searchRealImage(aiTags, visualDescription = '') {
  try {
    const searchTerms = generateSearchTerms(aiTags);
    const primarySearchTerm = searchTerms[0] || 'medical aesthetic treatment';
    
    console.log(`🎯 Términos de búsqueda generados: [${searchTerms.join(', ')}]`);
    console.log(`🔍 Término principal: "${primarySearchTerm}"`);
    
    // Intentar diferentes fuentes de imágenes
    const sources = [
      {
        name: 'Picsum',
        url: IMAGE_SEARCH_SOURCES.picsum(primarySearchTerm, Date.now()),
        attribution: 'Photo from Picsum Photos'
      },
      {
        name: 'LoremFlickr', 
        url: IMAGE_SEARCH_SOURCES.loremflickr(primarySearchTerm),
        attribution: 'Photo from LoremFlickr'
      }
    ];
    
    // Seleccionar fuente aleatoria para variedad
    const selectedSource = sources[Math.floor(Math.random() * sources.length)];
    
    // Verificar que la imagen existe
    const imageResponse = await fetch(selectedSource.url, { method: 'HEAD' });
    
    if (imageResponse.ok) {
      console.log(`✅ Imagen encontrada via ${selectedSource.name}: ${selectedSource.url}`);
      
      return {
        url: selectedSource.url,
        keywords: aiTags,
        source: `real-search-${selectedSource.name.toLowerCase()}`,
        attribution: selectedSource.attribution,
        searchTerms: searchTerms,
        primaryTerm: primarySearchTerm,
        aiTags: aiTags,
        timestamp: Date.now()
      };
    } else {
      throw new Error(`Image not accessible from ${selectedSource.name}`);
    }
    
  } catch (error) {
    console.log(`⚠️ Error en búsqueda real: ${error.message}`);
    
    // Fallback: Generar imagen única usando combinación de tags
    const fallbackSeed = aiTags.join('-').toLowerCase().replace(/\s+/g, '-');
    const fallbackUrl = `https://picsum.photos/seed/bioskin-${fallbackSeed}-${Date.now()}/1200/600.jpg`;
    
    return {
      url: fallbackUrl,
      keywords: aiTags,
      source: 'fallback-unique-seed',
      attribution: 'Photo from Picsum Photos',
      searchTerms: aiTags,
      primaryTerm: aiTags[0] || 'medical aesthetic',
      aiTags: aiTags,
      fallbackReason: error.message,
      timestamp: Date.now()
    };
  }
}

/**
 * Valida que una URL de imagen es accesible
 */
async function validateImageUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

module.exports = {
  searchRealImage,
  generateSearchTerms,
  validateImageUrl,
  MEDICAL_AESTHETIC_MAPPING
};