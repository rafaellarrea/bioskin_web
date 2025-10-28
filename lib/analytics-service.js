// lib/analytics-service.js
// Servicio de analytics para el sitio web BIOSKIN

class AnalyticsService {
  constructor() {
    this.STORAGE_KEY = 'bioskin_analytics';
    this.SESSION_KEY = 'bioskin_session';
    this.initializeAnalytics();
  }

  initializeAnalytics() {
    // Registrar visita actual
    this.recordPageView();
    // Configurar tracking de eventos
    this.setupEventTracking();
  }

  recordPageView() {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentHour = now.getHours();
    
    // Obtener datos existentes
    const analytics = this.getAnalyticsData();
    
    // Verificar si es una nueva sesión
    const sessionId = this.getOrCreateSession();
    const isNewSession = this.isNewSession(sessionId);
    
    // Incrementar contadores
    analytics.pageViews.total += 1;
    analytics.pageViews.daily[today] = (analytics.pageViews.daily[today] || 0) + 1;
    analytics.pageViews.hourly[currentHour] = (analytics.pageViews.hourly[currentHour] || 0) + 1;
    
    if (isNewSession) {
      analytics.sessions.total += 1;
      analytics.sessions.daily[today] = (analytics.sessions.daily[today] || 0) + 1;
    }
    
    // Guardar datos actualizados
    this.saveAnalyticsData(analytics);
  }

  getOrCreateSession() {
    let session = localStorage.getItem(this.SESSION_KEY);
    if (!session) {
      session = {
        id: Date.now().toString(),
        startTime: new Date().toISOString(),
        pageViews: 0
      };
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } else {
      session = JSON.parse(session);
    }
    
    // Actualizar página views de la sesión
    session.pageViews += 1;
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    
    return session;
  }

  isNewSession(session) {
    const sessionStart = new Date(session.startTime);
    const now = new Date();
    const sessionDuration = (now - sessionStart) / (1000 * 60); // minutos
    
    // Considerar nueva sesión si han pasado más de 30 minutos
    return sessionDuration < 1 && session.pageViews === 1;
  }

  setupEventTracking() {
    // Tracking de clicks en enlaces importantes
    document.addEventListener('click', (e) => {
      const element = e.target.closest('a[href*="admin"], a[href*="blog"], a[href*="appointment"]');
      if (element) {
        this.recordEvent('click', {
          type: 'link',
          href: element.href,
          text: element.textContent.trim()
        });
      }
    });

    // Tracking de tiempo en página
    this.startTimeTracking();
  }

  startTimeTracking() {
    this.pageStartTime = Date.now();
    
    // Registrar tiempo cuando el usuario abandona la página
    window.addEventListener('beforeunload', () => {
      const timeSpent = Math.round((Date.now() - this.pageStartTime) / 1000);
      this.recordEvent('time_on_page', { seconds: timeSpent });
    });
  }

  recordEvent(eventType, data = {}) {
    const analytics = this.getAnalyticsData();
    const today = new Date().toISOString().split('T')[0];
    
    if (!analytics.events[today]) {
      analytics.events[today] = [];
    }
    
    analytics.events[today].push({
      type: eventType,
      timestamp: new Date().toISOString(),
      data: data
    });
    
    this.saveAnalyticsData(analytics);
  }

  getAnalyticsData() {
    const defaultData = {
      pageViews: {
        total: 0,
        daily: {},
        hourly: Array(24).fill(0).reduce((acc, _, i) => ({ ...acc, [i]: 0 }), {})
      },
      sessions: {
        total: 0,
        daily: {}
      },
      events: {},
      deviceInfo: this.getDeviceInfo(),
      firstVisit: new Date().toISOString()
    };

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? { ...defaultData, ...JSON.parse(stored) } : defaultData;
    } catch {
      return defaultData;
    }
  }

  saveAnalyticsData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Could not save analytics data:', error);
    }
  }

  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  // Métodos para obtener estadísticas
  getDailyStats(days = 30) {
    const analytics = this.getAnalyticsData();
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

  getWeeklyStats(weeks = 8) {
    const dailyStats = this.getDailyStats(weeks * 7);
    const weeklyStats = [];
    
    for (let i = 0; i < dailyStats.length; i += 7) {
      const weekData = dailyStats.slice(i, i + 7);
      const weekStart = weekData[0]?.date;
      const weekEnd = weekData[weekData.length - 1]?.date;
      
      weeklyStats.push({
        week: `${weekStart} - ${weekEnd}`,
        pageViews: weekData.reduce((sum, day) => sum + day.pageViews, 0),
        sessions: weekData.reduce((sum, day) => sum + day.sessions, 0)
      });
    }
    
    return weeklyStats;
  }

  getMonthlyStats(months = 12) {
    const analytics = this.getAnalyticsData();
    const monthlyStats = [];
    const today = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthDays = Object.keys(analytics.pageViews.daily)
        .filter(day => day.startsWith(monthKey));
      
      const pageViews = monthDays.reduce((sum, day) => 
        sum + (analytics.pageViews.daily[day] || 0), 0);
      const sessions = monthDays.reduce((sum, day) => 
        sum + (analytics.sessions.daily[day] || 0), 0);
      
      monthlyStats.push({
        month: date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }),
        pageViews,
        sessions
      });
    }
    
    return monthlyStats;
  }

  getTotalStats() {
    const analytics = this.getAnalyticsData();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    return {
      total: {
        pageViews: analytics.pageViews.total,
        sessions: analytics.sessions.total
      },
      today: {
        pageViews: analytics.pageViews.daily[today] || 0,
        sessions: analytics.sessions.daily[today] || 0
      },
      yesterday: {
        pageViews: analytics.pageViews.daily[yesterdayStr] || 0,
        sessions: analytics.sessions.daily[yesterdayStr] || 0
      },
      thisWeek: this.getThisWeekStats(),
      thisMonth: this.getThisMonthStats()
    };
  }

  getThisWeekStats() {
    const analytics = this.getAnalyticsData();
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    let pageViews = 0;
    let sessions = 0;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      pageViews += analytics.pageViews.daily[dateStr] || 0;
      sessions += analytics.sessions.daily[dateStr] || 0;
    }
    
    return { pageViews, sessions };
  }

  getThisMonthStats() {
    const analytics = this.getAnalyticsData();
    const today = new Date();
    const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    const monthDays = Object.keys(analytics.pageViews.daily)
      .filter(day => day.startsWith(monthKey));
    
    const pageViews = monthDays.reduce((sum, day) => 
      sum + (analytics.pageViews.daily[day] || 0), 0);
    const sessions = monthDays.reduce((sum, day) => 
      sum + (analytics.sessions.daily[day] || 0), 0);
    
    return { pageViews, sessions };
  }

  getHourlyDistribution() {
    const analytics = this.getAnalyticsData();
    return analytics.pageViews.hourly;
  }

  // Método para exportar datos (para análisis avanzado)
  exportData() {
    return this.getAnalyticsData();
  }

  // Limpiar datos antiguos (mantener solo últimos 90 días)
  cleanupOldData() {
    const analytics = this.getAnalyticsData();
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
    
    // Limpiar eventos antiguos
    Object.keys(analytics.events).forEach(date => {
      if (date < cutoffStr) {
        delete analytics.events[date];
      }
    });
    
    this.saveAnalyticsData(analytics);
  }
}

// Crear instancia global
const analyticsService = new AnalyticsService();

// Auto-limpiar datos cada vez que se carga la página
analyticsService.cleanupOldData();

export default analyticsService;