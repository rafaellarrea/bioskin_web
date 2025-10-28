// src/hooks/useAnalytics.ts
// Hook personalizado para analytics del sitio web

import { useState, useEffect } from 'react';
import analyticsService from '../../lib/analytics-service.js';

interface AnalyticsStats {
  total: {
    pageViews: number;
    sessions: number;
  };
  today: {
    pageViews: number;
    sessions: number;
  };
  yesterday: {
    pageViews: number;
    sessions: number;
  };
  thisWeek: {
    pageViews: number;
    sessions: number;
  };
  thisMonth: {
    pageViews: number;
    sessions: number;
  };
}

interface DailyStats {
  date: string;
  pageViews: number;
  sessions: number;
}

interface WeeklyStats {
  week: string;
  pageViews: number;
  sessions: number;
}

interface MonthlyStats {
  month: string;
  pageViews: number;
  sessions: number;
}

const useAnalytics = () => {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [hourlyDistribution, setHourlyDistribution] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = () => {
    try {
      setIsLoading(true);
      
      // Obtener estadísticas principales
      const totalStats = analyticsService.getTotalStats();
      setStats(totalStats);
      
      // Obtener estadísticas por período
      const daily = analyticsService.getDailyStats(30); // Últimos 30 días
      setDailyStats(daily);
      
      const weekly = analyticsService.getWeeklyStats(8); // Últimas 8 semanas
      setWeeklyStats(weekly);
      
      const monthly = analyticsService.getMonthlyStats(12); // Últimos 12 meses
      setMonthlyStats(monthly);
      
      // Obtener distribución horaria
      const hourly = analyticsService.getHourlyDistribution();
      setHourlyDistribution(hourly);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Cargar analytics al montar el componente
    loadAnalytics();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(loadAnalytics, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const recordEvent = (eventType: string, data: any = {}) => {
    analyticsService.recordEvent(eventType, data);
    // Recargar stats después de un evento importante
    setTimeout(loadAnalytics, 100);
  };

  const exportData = () => {
    return analyticsService.exportData();
  };

  const getTopPages = () => {
    // Analizar eventos para encontrar páginas más visitadas
    const data = analyticsService.exportData();
    const pageViews: Record<string, number> = {};
    
    Object.values(data.events).flat().forEach((event: any) => {
      if (event.type === 'click' && event.data?.href) {
        const url = new URL(event.data.href);
        const path = url.hash || url.pathname;
        pageViews[path] = (pageViews[path] || 0) + 1;
      }
    });
    
    return Object.entries(pageViews)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([path, views]) => ({ path, views }));
  };

  const getBounceRate = () => {
    const data = analyticsService.exportData();
    
    // Calcular bounce rate basado en sesiones de una sola página
    const dailySessions = Object.values(data.sessions.daily).reduce((a, b) => (a as number) + (b as number), 0) as number;
    const dailyPageViews = Object.values(data.pageViews.daily).reduce((a, b) => (a as number) + (b as number), 0) as number;
    
    const avgPagesPerSession = dailySessions > 0 ? dailyPageViews / dailySessions : 0;
    const bounceRate = avgPagesPerSession < 1.5 ? 70 : Math.max(30, 100 - (avgPagesPerSession * 20));
    
    return Math.round(bounceRate);
  };

  const getGrowthRate = (period: 'daily' | 'weekly' | 'monthly' = 'daily') => {
    let currentPeriodViews = 0;
    let previousPeriodViews = 0;
    
    if (period === 'daily') {
      currentPeriodViews = stats?.today.pageViews || 0;
      previousPeriodViews = stats?.yesterday.pageViews || 0;
    } else if (period === 'weekly') {
      const weeklyData = weeklyStats.slice(-2);
      currentPeriodViews = weeklyData[1]?.pageViews || 0;
      previousPeriodViews = weeklyData[0]?.pageViews || 0;
    } else if (period === 'monthly') {
      const monthlyData = monthlyStats.slice(-2);
      currentPeriodViews = monthlyData[1]?.pageViews || 0;
      previousPeriodViews = monthlyData[0]?.pageViews || 0;
    }
    
    if (previousPeriodViews === 0) return 0;
    
    const growth = ((currentPeriodViews - previousPeriodViews) / previousPeriodViews) * 100;
    return Math.round(growth);
  };

  const getPeakHours = () => {
    const hours = Object.entries(hourlyDistribution)
      .map(([hour, views]) => ({ hour: parseInt(hour), views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 3);
    
    return hours.map(h => ({
      hour: h.hour,
      views: h.views,
      time: `${h.hour.toString().padStart(2, '0')}:00`
    }));
  };

  return {
    // Datos principales
    stats,
    dailyStats,
    weeklyStats,
    monthlyStats,
    hourlyDistribution,
    isLoading,
    
    // Funciones
    recordEvent,
    exportData,
    refreshStats: loadAnalytics,
    
    // Métricas calculadas
    getTopPages,
    getBounceRate,
    getGrowthRate,
    getPeakHours,
    
    // Métodos de conveniencia
    trackPageView: () => recordEvent('page_view'),
    trackButtonClick: (buttonName: string) => recordEvent('button_click', { button: buttonName }),
    trackFormSubmit: (formName: string) => recordEvent('form_submit', { form: formName }),
  };
};

export default useAnalytics;