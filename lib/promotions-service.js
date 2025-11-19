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
   * Detecta el rol del bot según el contexto de la conversación
   * @param {string} userMessage - Mensaje del usuario
   * @param {Array} conversationHistory - Historial de conversación
   * @returns {string} - 'medico' o 'tecnico'
   */
  detectRole(userMessage, conversationHistory = []) {
    const data = this.loadPromotions();
    const keywords = data.bot_instructions?.roleDetectionKeywords || {
      medico: ['tratamiento', 'facial', 'limpieza', 'consulta', 'cita'],
      tecnico: ['equipo', 'aparato', 'dispositivo', 'máquina', 'compra']
    };

    // Combinar mensaje actual con últimos 3 mensajes del historial
    const recentMessages = conversationHistory.slice(-3).map(m => m.content).join(' ');
    const fullContext = (userMessage + ' ' + recentMessages).toLowerCase();

    // Contar coincidencias por rol
    const medicoMatches = keywords.medico.filter(kw => fullContext.includes(kw.toLowerCase())).length;
    const tecnicoMatches = keywords.tecnico.filter(kw => fullContext.includes(kw.toLowerCase())).length;

    console.log(`🔍 [Promotions] Detección de rol: médico=${medicoMatches}, técnico=${tecnicoMatches}`);

    // Si hay más coincidencias técnicas, es técnico; por defecto, médico
    return tecnicoMatches > medicoMatches ? 'tecnico' : 'medico';
  }

  /**
   * Obtiene el saludo según el rol detectado
   */
  getRoleGreeting(role) {
    const data = this.loadPromotions();
    const roleData = data.roles?.[role];
    return roleData?.greeting || 'Buenos días, soy Salomé de BIOSKIN. 😊 ¿En qué puedo asistirle?';
  }

  /**
   * Obtiene información del contacto según el rol
   */
  getRoleContact(role) {
    const data = this.loadPromotions();
    const roleData = data.roles?.[role];
    return roleData?.contact || {
      name: 'Dra. Daniela Creamer',
      role: 'Médico Estético',
      phone: '+593969890689'
    };
  }

  /**
   * Obtiene todas las promociones activas
   */
  getActivePromotions() {
    const data = this.loadPromotions();
    if (!data.active) return [];

    const allPromotions = [
      ...data.promotions.services,
      ...data.promotions.products,
      ...data.promotions.equipment
    ];

    // Solo filtrar por campo 'active', SIN validación automática de fechas
    return allPromotions.filter(promo => promo.active === true);
  }

  /**
   * Obtiene todas las promociones activas filtradas por rol
   * @param {string} role - 'medico' o 'tecnico'
   */
  getActivePromotionsByRole(role) {
    const allPromotions = this.getActivePromotions();
    return allPromotions.filter(promo => !promo.role || promo.role === role);
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
   * Solo verifica el campo 'active', sin validación automática de fechas
   */
  hasPromotionsInCategory(category) {
    const data = this.loadPromotions();
    if (!data.active) return false;

    const categoryPromotions = data.promotions[category] || [];

    // Solo verificar campo 'active'
    return categoryPromotions.some(promo => promo.active === true);
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
