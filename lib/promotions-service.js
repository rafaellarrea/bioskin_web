import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Servicio de gestión de promociones
 * Lee y valida promociones activas en servicios, productos y equipos
 */
export class PromotionsService {
  constructor() {
    this.promotionsPath = path.join(__dirname, '../data/promotions.json');
    this.promotionsCache = null;
    this.lastLoadTime = null;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutos de cache
  }

  /**
   * Carga las promociones desde el archivo JSON
   */
  loadPromotions() {
    try {
      // Verificar si el cache sigue siendo válido
      if (this.promotionsCache && this.lastLoadTime) {
        const timeSinceLoad = Date.now() - this.lastLoadTime;
        if (timeSinceLoad < this.cacheExpiry) {
          console.log('✅ [Promotions] Usando cache de promociones');
          return this.promotionsCache;
        }
      }

      console.log('📖 [Promotions] Cargando promociones desde archivo...');
      const data = fs.readFileSync(this.promotionsPath, 'utf8');
      const promotions = JSON.parse(data);

      // Validar estructura
      if (!promotions.active) {
        console.log('⚠️ [Promotions] Sistema de promociones desactivado');
        return { active: false, promotions: { services: [], products: [], equipment: [] } };
      }

      // Actualizar cache
      this.promotionsCache = promotions;
      this.lastLoadTime = Date.now();

      console.log(`✅ [Promotions] Promociones cargadas: ${this.countActivePromotions(promotions)} activas`);
      return promotions;
    } catch (error) {
      console.error('❌ [Promotions] Error cargando promociones:', error.message);
      return { active: false, promotions: { services: [], products: [], equipment: [] } };
    }
  }

  /**
   * Cuenta el número de promociones activas
   */
  countActivePromotions(promotions) {
    const services = promotions.promotions.services.filter(p => p.active).length;
    const products = promotions.promotions.products.filter(p => p.active).length;
    const equipment = promotions.promotions.equipment.filter(p => p.active).length;
    return services + products + equipment;
  }

  /**
   * Obtiene todas las promociones activas
   */
  getActivePromotions() {
    const data = this.loadPromotions();
    if (!data.active) return [];

    const now = new Date();
    const allPromotions = [
      ...data.promotions.services,
      ...data.promotions.products,
      ...data.promotions.equipment
    ];

    return allPromotions.filter(promo => {
      if (!promo.active) return false;

      // Validar fechas
      const validFrom = promo.validFrom ? new Date(promo.validFrom) : null;
      const validUntil = promo.validUntil ? new Date(promo.validUntil) : null;

      if (validFrom && now < validFrom) return false;
      if (validUntil && now > validUntil) return false;

      return true;
    });
  }

  /**
   * Busca promociones para un servicio/producto específico
   */
  findPromotionByService(serviceName) {
    const activePromotions = this.getActivePromotions();
    const lowerServiceName = serviceName.toLowerCase();

    return activePromotions.find(promo => {
      const promoService = promo.service?.toLowerCase() || '';
      const promoName = promo.name?.toLowerCase() || '';
      
      return promoService.includes(lowerServiceName) || 
             lowerServiceName.includes(promoService) ||
             promoName.includes(lowerServiceName);
    });
  }

  /**
   * Genera mensaje de promoción para el chatbot
   */
  getPromotionMessage(serviceName) {
    const promo = this.findPromotionByService(serviceName);
    if (!promo) return null;

    return {
      hasPromotion: true,
      message: promo.displayMessage,
      details: {
        name: promo.name,
        originalPrice: promo.originalPrice,
        promoPrice: promo.promoPrice,
        discount: promo.discount,
        quantity: promo.quantity,
        pricePerUnit: promo.pricePerUnit,
        validUntil: promo.validUntil,
        terms: promo.terms
      }
    };
  }

  /**
   * Obtiene resumen de todas las promociones activas
   */
  getPromotionsSummary() {
    const activePromotions = this.getActivePromotions();
    
    if (activePromotions.length === 0) {
      return {
        hasPromotions: false,
        message: 'Por el momento no contamos con promociones activas.'
      };
    }

    const messages = activePromotions.map(promo => promo.displayMessage);
    
    return {
      hasPromotions: true,
      count: activePromotions.length,
      message: `🎉 PROMOCIONES ACTIVAS:\n\n${messages.join('\n\n')}`,
      promotions: activePromotions
    };
  }

  /**
   * Verifica si hay promociones para categoría específica
   */
  hasPromotionsInCategory(category) {
    const data = this.loadPromotions();
    if (!data.active) return false;

    const categoryPromotions = data.promotions[category] || [];
    const now = new Date();

    return categoryPromotions.some(promo => {
      if (!promo.active) return false;

      const validFrom = promo.validFrom ? new Date(promo.validFrom) : null;
      const validUntil = promo.validUntil ? new Date(promo.validUntil) : null;

      if (validFrom && now < validFrom) return false;
      if (validUntil && now > validUntil) return false;

      return true;
    });
  }

  /**
   * Obtiene instrucciones del bot sobre cómo manejar promociones
   */
  getBotInstructions() {
    const data = this.loadPromotions();
    return data.bot_instructions || {
      checkBeforePrice: true,
      alwaysMentionIfActive: true,
      suggestBestDeal: true,
      priority: 'promotion_first'
    };
  }

  /**
   * Invalida el cache (útil para forzar recarga)
   */
  clearCache() {
    this.promotionsCache = null;
    this.lastLoadTime = null;
    console.log('🔄 [Promotions] Cache limpiado');
  }
}

// Instancia singleton
export const promotionsService = new PromotionsService();
