// lib/vercel-analytics.js
// Integración con Vercel Analytics para conteo real de visitas

import { track } from '@vercel/analytics';

class VercelAnalyticsService {
  constructor() {
    this.initializeTracking();
  }

  initializeTracking() {
    // Track page view automático
    this.trackPageView();
    
    // Track eventos importantes
    this.setupEventTracking();
  }

  trackPageView(page = window.location.pathname + window.location.hash) {
    track('page_view', {
      page,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.split(' ').slice(0, 3).join(' ') // Solo parte importante
    });
  }

  trackAdminAccess() {
    track('admin_access', {
      timestamp: new Date().toISOString(),
      page: window.location.pathname + window.location.hash
    });
  }

  trackAppointmentRequest() {
    track('appointment_request', {
      timestamp: new Date().toISOString()
    });
  }

  trackBlogView(blogSlug) {
    track('blog_view', {
      slug: blogSlug,
      timestamp: new Date().toISOString()
    });
  }

  trackProductView(productSlug) {
    track('product_view', {
      slug: productSlug,
      timestamp: new Date().toISOString()
    });
  }

  trackServiceView(serviceName) {
    track('service_view', {
      service: serviceName,
      timestamp: new Date().toISOString()
    });
  }

  setupEventTracking() {
    // Track clicks importantes
    document.addEventListener('click', (e) => {
      const element = e.target.closest('a[href*="admin"]');
      if (element) {
        this.trackAdminAccess();
      }

      const appointmentBtn = e.target.closest('button[class*="appointment"], a[href*="appointment"]');
      if (appointmentBtn) {
        this.trackAppointmentRequest();
      }
    });
  }

  // Mock para compatibilidad con el dashboard actual
  // Estas funciones retornan datos simulados hasta que migremos completamente
  getTotalStats() {
    return {
      total: {
        pageViews: 0, // Vercel Analytics maneja esto
        sessions: 0   // Vercel Analytics maneja esto
      },
      today: {
        pageViews: 0,
        sessions: 0
      },
      yesterday: {
        pageViews: 0,
        sessions: 0
      },
      thisWeek: {
        pageViews: 0,
        sessions: 0
      },
      thisMonth: {
        pageViews: 0,
        sessions: 0
      }
    };
  }

  getDailyStats(days = 30) {
    const stats = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      stats.push({
        date: dateStr,
        pageViews: 0, // Datos reales vienen de Vercel Dashboard
        sessions: 0
      });
    }
    
    return stats;
  }

  getWeeklyStats(weeks = 8) {
    return Array(weeks).fill(0).map((_, i) => ({
      week: `Semana ${i + 1}`,
      pageViews: 0,
      sessions: 0
    }));
  }

  getMonthlyStats(months = 12) {
    return Array(months).fill(0).map((_, i) => ({
      month: `Mes ${i + 1}`,
      pageViews: 0,
      sessions: 0
    }));
  }

  getHourlyDistribution() {
    return Array(24).fill(0).reduce((acc, _, i) => ({ ...acc, [i]: 0 }), {});
  }

  exportData() {
    return {
      note: 'Los datos reales están en Vercel Analytics Dashboard',
      url: 'https://vercel.com/analytics',
      pageViews: { daily: {}, hourly: {}, total: 0 },
      sessions: { daily: {}, total: 0 },
      events: {}
    };
  }
}

// Crear instancia global
const vercelAnalyticsService = new VercelAnalyticsService();

export default vercelAnalyticsService;