// lib/hybrid-analytics.js
// Sistema de analytics híbrido para Plan Hobby Vercel
// Combina Vercel Analytics oficial + localStorage mejorado

import { track } from '@vercel/analytics';

class HybridAnalyticsService {
  constructor() {
    this.STORAGE_KEY = 'bioskin_analytics_v2';
    this.SESSION_KEY = 'bioskin_session_v2';
    this.visitorId = this.getOrCreateVisitorId();
    this.initializeTracking();
  }

  getOrCreateVisitorId() {
    let visitorId = localStorage.getItem('bioskin_visitor_id');
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('bioskin_visitor_id', visitorId);
    }
    return visitorId;
  }

  initializeTracking() {
    // Registrar visita automáticamente
    this.trackPageView();
    
    // Setup de event tracking
    this.setupEventTracking();
  }

  async trackPageView(page = window.location.pathname + window.location.hash) {
    // 1. Enviar a Vercel Analytics (datos reales oficiales)
    track('page_view', {
      page,
      visitorId: this.visitorId,
      timestamp: new Date().toISOString()
    });

    // 2. Enviar al API global para conteo unificado
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'page_view',
          data: {
            page,
            visitorId: this.visitorId,
            timestamp: new Date().toISOString()
          }
        })
      });
    } catch (error) {
      console.warn('Error enviando a analytics API:', error);
    }

    // 3. Actualizar localStorage (para UI del dashboard)
    this.updateLocalStats('page_view', { page });
  }

  async trackEvent(eventType, eventData = {}) {
    // 1. Enviar a Vercel Analytics
    track(eventType, {
      ...eventData,
      visitorId: this.visitorId,
      timestamp: new Date().toISOString()
    });

    // 2. Enviar al API global
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: eventType,
          data: {
            ...eventData,
            visitorId: this.visitorId,
            timestamp: new Date().toISOString()
          }
        })
      });
    } catch (error) {
      console.warn('Error enviando evento a analytics API:', error);
    }

    // 3. Actualizar localStorage
    this.updateLocalStats(eventType, eventData);
  }

  updateLocalStats(eventType, eventData) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getHours();

    // Obtener datos existentes
    const analytics = this.getLocalAnalytics();

    if (eventType === 'page_view') {
      // Incrementar contadores
      analytics.pageViews.total += 1;
      analytics.pageViews.daily[today] = (analytics.pageViews.daily[today] || 0) + 1;
      analytics.pageViews.hourly[currentHour] = (analytics.pageViews.hourly[currentHour] || 0) + 1;

      // Verificar sesión única
      const sessionKey = `${this.visitorId}_${today}`;
      if (!analytics.sessions.uniqueVisitors.includes(sessionKey)) {
        analytics.sessions.total += 1;
        analytics.sessions.daily[today] = (analytics.sessions.daily[today] || 0) + 1;
        analytics.sessions.uniqueVisitors.push(sessionKey);
      }

      // Registrar página visitada
      const page = eventData.page || 'unknown';
      analytics.pages[page] = (analytics.pages[page] || 0) + 1;
    }

    // Registrar evento para análisis
    analytics.events.push({
      type: eventType,
      data: eventData,
      timestamp: now.toISOString(),
      visitorId: this.visitorId
    });

    // Mantener solo últimos 100 eventos
    if (analytics.events.length > 100) {
      analytics.events = analytics.events.slice(-100);
    }

    // Guardar
    this.saveLocalAnalytics(analytics);
  }

  getLocalAnalytics() {
    const defaultData = {
      pageViews: {
        total: 0,
        daily: {},
        hourly: Array(24).fill(0).reduce((acc, _, i) => ({ ...acc, [i]: 0 }), {})
      },
      sessions: {
        total: 0,
        daily: {},
        uniqueVisitors: []
      },
      pages: {},
      events: [],
      firstVisit: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? { ...defaultData, ...JSON.parse(stored) } : defaultData;
    } catch {
      return defaultData;
    }
  }

  saveLocalAnalytics(data) {
    try {
      data.lastUpdated = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Error guardando analytics locales:', error);
    }
  }

  async getStats() {
    // Intentar obtener datos del API global primero
    try {
      const response = await fetch('/api/analytics');
      if (response.ok) {
        const globalStats = await response.json();
        // Verificar si los datos son válidos y recientes
        const lastUpdated = new Date(globalStats.lastUpdated);
        const now = new Date();
        const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60);
        
        // Si los datos son muy antiguos (más de 24 horas), resetear
        if (hoursSinceUpdate > 24) {
          console.warn('Datos del servidor muy antiguos, reseteando...');
          await this.resetDailyStats();
        }
        
        // Retornar datos globales reales del servidor
        return {
          ...globalStats,
          source: 'global-server',
          realDataUrl: 'https://vercel.com/analytics',
          note: 'Datos globales reales - Todas las visitas de todos los navegadores',
          isGlobalData: true,
          status: 'connected'
        };
      } else {
        throw new Error(`API respondió con status ${response.status}`);
      }
    } catch (error) {
      console.warn('❌ Error obteniendo stats globales:', error.message);
      
      // Fallback: usar datos locales con mensaje claro
      const analytics = this.getLocalAnalytics();
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Verificar si necesitamos reseteo diario local
      this.checkDailyReset(analytics);

      // Calcular estadísticas de la semana
      const thisWeekStats = this.calculateWeekStats(analytics, now);
      const thisMonthStats = this.calculateMonthStats(analytics, now);

      // Páginas más visitadas
      const topPages = Object.entries(analytics.pages)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([page, views]) => ({ page, views }));

      // Visitantes activos (simulado para demo)
      const realtimeVisitors = this.calculateActiveVisitors(analytics);

      return {
        total: {
          pageViews: analytics.pageViews.total,
          sessions: analytics.sessions.total,
          uniqueVisitors: analytics.sessions.uniqueVisitors.length
        },
        today: {
          pageViews: analytics.pageViews.daily[today] || 0,
          sessions: analytics.sessions.daily[today] || 0
        },
        yesterday: {
          pageViews: analytics.pageViews.daily[yesterday] || 0,
          sessions: analytics.sessions.daily[yesterday] || 0
        },
        thisWeek: thisWeekStats,
        thisMonth: thisMonthStats,
        topPages,
        hourlyDistribution: analytics.pageViews.hourly,
        realtimeVisitors,
        lastUpdated: analytics.lastUpdated,
        source: 'localStorage-fallback',
        realDataUrl: 'https://vercel.com/analytics',
        note: '⚠️ MODO LOCAL: API global no disponible - Solo datos de este navegador',
        isGlobalData: false,
        status: 'disconnected',
        errorMessage: error.message
      };
    }
  }

  calculateWeekStats(analytics, now) {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    
    let weekViews = 0;
    let weekSessions = 0;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      weekViews += analytics.pageViews.daily[dateStr] || 0;
      weekSessions += analytics.sessions.daily[dateStr] || 0;
    }
    
    return { pageViews: weekViews, sessions: weekSessions };
  }

  calculateMonthStats(analytics, now) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const monthDays = Object.keys(analytics.pageViews.daily)
      .filter(day => day.startsWith(monthKey));
    
    const monthViews = monthDays.reduce((sum, day) => 
      sum + (analytics.pageViews.daily[day] || 0), 0);
    const monthSessions = monthDays.reduce((sum, day) => 
      sum + (analytics.sessions.daily[day] || 0), 0);
    
    return { pageViews: monthViews, sessions: monthSessions };
  }

  calculateActiveVisitors(analytics) {
    // Simular visitantes activos basado en eventos recientes
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const recentEvents = analytics.events.filter(event => 
      new Date(event.timestamp) > fiveMinutesAgo
    );
    
    const uniqueVisitors = new Set(recentEvents.map(event => event.visitorId));
    return uniqueVisitors.size;
  }

  setupEventTracking() {
    // Track admin access
    if (window.location.hash.includes('admin')) {
      this.trackEvent('admin_access', { 
        page: window.location.hash 
      });
    }

    // Track clicks importantes
    document.addEventListener('click', (e) => {
      const appointmentBtn = e.target.closest('button[class*="appointment"], a[href*="appointment"]');
      if (appointmentBtn) {
        this.trackEvent('appointment_click', {
          element: appointmentBtn.textContent.trim()
        });
      }

      const navLink = e.target.closest('a[href^="#"]');
      if (navLink) {
        this.trackEvent('navigation', {
          destination: navLink.getAttribute('href'),
          text: navLink.textContent.trim()
        });
      }
    });
  }

  // Métodos de compatibilidad con hooks existentes
  async getTotalStats() {
    const stats = await this.getStats();
    return {
      total: stats.total,
      today: stats.today,
      yesterday: stats.yesterday,
      thisWeek: stats.thisWeek,
      thisMonth: stats.thisMonth,
      source: stats.source,
      note: stats.note
    };
  }

  async getDailyStats(days = 30) {
    const analytics = this.getLocalAnalytics();
    const stats = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      stats.push({
        date: dateStr,
        pageViews: analytics.pageViews.daily[dateStr] || 0,
        sessions: analytics.sessions.daily[dateStr] || 0
      });
    }
    
    return stats;
  }

  async getWeeklyStats(weeks = 8) {
    const weeklyStats = [];
    const analytics = this.getLocalAnalytics();
    const today = new Date();
    
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7));
      
      // Calcular visitas de esa semana basado en datos reales
      let weekViews = 0;
      let weekSessions = 0;
      
      for (let j = 0; j < 7; j++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + j);
        const dateStr = date.toISOString().split('T')[0];
        
        weekViews += analytics.pageViews.daily[dateStr] || 0;
        weekSessions += analytics.sessions.daily[dateStr] || 0;
      }
      
      weeklyStats.push({
        week: `Semana ${weeks - i}`,
        pageViews: weekViews,
        sessions: weekSessions
      });
    }
    
    return weeklyStats;
  }

  async getMonthlyStats(months = 12) {
    const monthlyStats = [];
    const analytics = this.getLocalAnalytics();
    const today = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthDays = Object.keys(analytics.pageViews.daily)
        .filter(day => day.startsWith(monthKey));
      
      const monthViews = monthDays.reduce((sum, day) => 
        sum + (analytics.pageViews.daily[day] || 0), 0);
      const monthSessions = monthDays.reduce((sum, day) => 
        sum + (analytics.sessions.daily[day] || 0), 0);
      
      monthlyStats.push({
        month: date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }),
        pageViews: monthViews,
        sessions: monthSessions
      });
    }
    
    return monthlyStats;
  }

  async getHourlyDistribution() {
    const analytics = this.getLocalAnalytics();
    return analytics.pageViews.hourly;
  }

  exportData() {
    const analytics = this.getLocalAnalytics();
    return {
      ...analytics,
      note: 'Datos híbridos: Vercel Analytics (real) + localStorage (UI)',
      realDataUrl: 'https://vercel.com/analytics'
    };
  }

  // Limpiar datos antiguos
  cleanupOldData() {
    const analytics = this.getLocalAnalytics();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    
    // Limpiar datos diarios antiguos
    Object.keys(analytics.pageViews.daily).forEach(date => {
      if (date < cutoffStr) {
        delete analytics.pageViews.daily[date];
        delete analytics.sessions.daily[date];
      }
    });
    
    this.saveLocalAnalytics(analytics);
  }

  // Verificar y realizar reseteo diario local
  checkDailyReset(analytics) {
    const today = new Date().toISOString().split('T')[0];
    const lastReset = analytics.lastReset || analytics.firstVisit?.split('T')[0];
    
    if (lastReset !== today) {
      console.log('🔄 Realizando reseteo diario local...');
      
      // Resetear contadores de hoy (mantener histórico)
      const todayViews = analytics.pageViews.daily[today] || 0;
      const todaySessions = analytics.sessions.daily[today] || 0;
      
      // Mantener histórico pero resetear total del día
      analytics.pageViews.daily[today] = 0;
      analytics.sessions.daily[today] = 0;
      analytics.lastReset = today;
      
      // Limpiar visitantes únicos del día anterior
      analytics.sessions.uniqueVisitors = analytics.sessions.uniqueVisitors.filter(visitor => {
        return visitor.includes(today);
      });
      
      this.saveLocalAnalytics(analytics);
      console.log(`✅ Reseteo diario completado. Anterior: ${todayViews} vistas, ${todaySessions} sesiones`);
    }
  }

  // Resetear estadísticas del servidor (llamar al API)
  async resetDailyStats() {
    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'reset_daily',
          data: {
            timestamp: new Date().toISOString(),
            action: 'daily_reset'
          }
        })
      });
      
      if (response.ok) {
        console.log('✅ Reseteo diario del servidor completado');
      } else {
        console.warn('⚠️ No se pudo resetear el servidor, continuando...');
      }
    } catch (error) {
      console.warn('⚠️ Error al resetear servidor:', error.message);
    }
  }

  // Obtener URL para datos reales
  getRealAnalyticsUrl() {
    return 'https://vercel.com/analytics';
  }
}

// Crear instancia global
const hybridAnalyticsService = new HybridAnalyticsService();

// Auto-limpiar datos antiguos
hybridAnalyticsService.cleanupOldData();

export default hybridAnalyticsService;