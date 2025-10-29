// src/hooks/useAnalytics.ts
// Hook personalizado para analytics del sitio web

import { useState, useEffect } from 'react';
import hybridAnalyticsService from '../../lib/hybrid-analytics.js';

interface AnalyticsStats {
  total: {
    pageViews: number;
    sessions: number;
    uniqueVisitors?: number;
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
  const [analyticsStatus, setAnalyticsStatus] = useState<{
    isGlobalData: boolean;
    status: 'connected' | 'disconnected';
    source: string;
    note: string;
    errorMessage?: string;
  } | null>(null);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      
      // Obtener estadísticas principales (ahora de nuestro sistema personalizado)
      const totalStats = await hybridAnalyticsService.getTotalStats();
      setStats(totalStats);
      
      // Obtener información completa para el estado del sistema
      const fullStats = await hybridAnalyticsService.getStats();
      setAnalyticsStatus({
        isGlobalData: fullStats.isGlobalData || false,
        status: fullStats.status || 'disconnected',
        source: fullStats.source || 'unknown',
        note: fullStats.note || '',
        errorMessage: fullStats.errorMessage
      });
      
      // Obtener estadísticas por período
      const daily = await hybridAnalyticsService.getDailyStats(30); // Últimos 30 días
      setDailyStats(daily);
      
      const weekly = await hybridAnalyticsService.getWeeklyStats(8); // Últimas 8 semanas
      setWeeklyStats(weekly);
      
      const monthly = await hybridAnalyticsService.getMonthlyStats(12); // Últimos 12 meses
      setMonthlyStats(monthly);
      
      // Obtener distribución horaria
      const hourly = await hybridAnalyticsService.getHourlyDistribution();
      setHourlyDistribution(hourly);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalyticsStatus({
        isGlobalData: false,
        status: 'disconnected',
        source: 'error',
        note: 'Error al cargar datos de analytics',
        errorMessage: error instanceof Error ? error.message : 'Error desconocido'
      });
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
    // Los eventos ahora se envían a nuestro sistema personalizado
    hybridAnalyticsService.trackEvent(eventType, data);
    // Recargar stats después de un evento importante
    setTimeout(loadAnalytics, 100);
  };

  const exportData = () => {
    return hybridAnalyticsService.exportData();
  };

  const getTopPages = async () => {
    try {
      const stats = await hybridAnalyticsService.getStats();
      return stats.topPages || [];
    } catch (error) {
      console.error('Error getting top pages:', error);
      return [];
    }
  };

  const getBounceRate = () => {
    // Calcular bounce rate basado en datos reales cuando estén disponibles
    // Por ahora retornamos un promedio estimado para sitios médicos
    return 45;
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
    analyticsStatus,
    
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