// src/hooks/useBlogAdmin.ts
// Hook personalizado para gestionar la administración de blogs

import { useState, useEffect, useCallback } from 'react';

interface BlogStats {
  currentWeek: string;
  weeklyLimits: {
    total: number;
    'medico-estetico': number;
    'tecnico': number;
  };
  generated: {
    total: number;
    'medico-estetico': number;
    'tecnico': number;
  };
  canGenerate: {
    'medico-estetico': boolean;
    'tecnico': boolean;
    any: boolean;
  };
}

interface GenerationRequest {
  blogType: 'medico-estetico' | 'tecnico';
  topic?: string;
  manual: boolean;
}

interface GenerationResult {
  success: boolean;
  message: string;
  blog?: any;
  meta?: any;
  error?: any;
}

const useBlogAdmin = () => {
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerationResult, setLastGenerationResult] = useState<GenerationResult | null>(null);

  // Cargar estadísticas
  const loadStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const response = await fetch('/api/ai-blog/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        console.error('Error cargando estadísticas:', data.message);
      }
    } catch (error) {
      console.error('Error de conexión al cargar estadísticas:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Generar blog
  const generateBlog = useCallback(async (request: GenerationRequest): Promise<GenerationResult> => {
    setIsGenerating(true);
    setLastGenerationResult(null);

    try {
      const response = await fetch('/api/ai-blog/generate-production', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      const result = await response.json();
      setLastGenerationResult(result);

      // Actualizar estadísticas si la generación fue exitosa
      if (result.success && stats) {
        const newStats = { ...stats };
        newStats.generated.total += 1;
        newStats.generated[request.blogType] += 1;
        
        // Recalcular si se puede generar más
        newStats.canGenerate['medico-estetico'] = newStats.generated['medico-estetico'] < newStats.weeklyLimits['medico-estetico'];
        newStats.canGenerate['tecnico'] = newStats.generated['tecnico'] < newStats.weeklyLimits['tecnico'];
        newStats.canGenerate.any = newStats.generated.total < newStats.weeklyLimits.total;
        
        setStats(newStats);
      }

      return result;
    } catch (error) {
      const errorResult: GenerationResult = {
        success: false,
        message: 'Error de conexión',
        error: error instanceof Error ? error.message : String(error)
      };
      
      setLastGenerationResult(errorResult);
      return errorResult;
    } finally {
      setIsGenerating(false);
    }
  }, [stats]);

  // Limpiar resultado anterior
  const clearLastResult = useCallback(() => {
    setLastGenerationResult(null);
  }, []);

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    // Estado
    stats,
    isLoadingStats,
    isGenerating,
    lastGenerationResult,
    
    // Acciones
    generateBlog,
    loadStats,
    clearLastResult,
    
    // Utilidades
    canGenerate: (type?: 'medico-estetico' | 'tecnico') => {
      if (!stats) return false;
      return type ? stats.canGenerate[type] : stats.canGenerate.any;
    },
    
    getRemainingSlots: (type?: 'medico-estetico' | 'tecnico') => {
      if (!stats) return 0;
      if (type) {
        return Math.max(0, stats.weeklyLimits[type] - stats.generated[type]);
      }
      return Math.max(0, stats.weeklyLimits.total - stats.generated.total);
    },
    
    getProgress: () => {
      if (!stats) return 0;
      return (stats.generated.total / stats.weeklyLimits.total) * 100;
    }
  };
};

export default useBlogAdmin;