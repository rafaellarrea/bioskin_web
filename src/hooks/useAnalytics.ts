// src/hooks/useAnalytics.ts
// Hook personalizado para analytics del sitio web

import { useState, useEffect } from 'react';
import vercelAnalyticsService from '../../lib/vercel-analytics.js';

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
      
      // Obtener estadísticas principales (ahora de Vercel Analytics)
      const totalStats = vercelAnalyticsService.getTotalStats();
      setStats(totalStats);
      
      // Obtener estadísticas por período
      const daily = vercelAnalyticsService.getDailyStats(30); // Últimos 30 días
      setDailyStats(daily);
      
      const weekly = vercelAnalyticsService.getWeeklyStats(8); // Últimas 8 semanas
      setWeeklyStats(weekly);
      
      const monthly = vercelAnalyticsService.getMonthlyStats(12); // Últimos 12 meses
      setMonthlyStats(monthly);
      
      // Obtener distribución horaria
      const hourly = vercelAnalyticsService.getHourlyDistribution();
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
    // Los eventos ahora se envían a Vercel Analytics automáticamente
    console.log('Event tracked:', eventType, data);
    // Recargar stats después de un evento importante
    setTimeout(loadAnalytics, 100);
  };

  const exportData = () => {
    return vercelAnalyticsService.exportData();
  };

  const getTopPages = () => {
    // Analizar eventos para encontrar páginas más visitadas
    const data = vercelAnalyticsService.exportData();
    // Por ahora retornamos páginas mock hasta que migremos completamente
    return [
      { path: '/admin', views: 0 },
      { path: '/appointment', views: 0 },
      { path: '/products', views: 0 }
    ];
  };

  const getBounceRate = () => {
    // Por ahora retornamos un bounce rate estimado
    // Los datos reales están en Vercel Analytics Dashboard
    return 45; // Promedio típico para sitios médicos
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