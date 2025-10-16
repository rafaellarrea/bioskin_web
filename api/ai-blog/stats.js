// api/ai-blog/stats.js
// Endpoint para obtener estadísticas de blogs generados

export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Método no permitido. Use GET.',
      endpoint: '/api/ai-blog/stats'
    });
  }

  try {
    // Función para obtener semana del año
    const getCurrentWeekYear = () => {
      const date = new Date();
      const week = getWeekNumber(date);
      return `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
    };

    const getWeekNumber = (date) => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    const currentWeek = getCurrentWeekYear();

    // Simulación de estadísticas (en producción, esto vendría de la base de datos)
    // Por ahora, simulamos datos para que la interfaz funcione
    const mockStats = {
      currentWeek,
      weeklyLimits: {
        total: 2,
        'medico-estetico': 1,
        'tecnico': 1
      },
      generated: {
        total: 0, // Se actualizará dinámicamente
        'medico-estetico': 0,
        'tecnico': 0
      },
      canGenerate: {
        'medico-estetico': true,
        'tecnico': true,
        any: true
      },
      history: [
        {
          week: currentWeek,
          generated: 0,
          types: { 'medico-estetico': 0, 'tecnico': 0 }
        }
      ]
    };

    // Calcular si se puede generar más contenido
    mockStats.canGenerate['medico-estetico'] = mockStats.generated['medico-estetico'] < mockStats.weeklyLimits['medico-estetico'];
    mockStats.canGenerate['tecnico'] = mockStats.generated['tecnico'] < mockStats.weeklyLimits['tecnico'];
    mockStats.canGenerate.any = mockStats.generated.total < mockStats.weeklyLimits.total;

    res.status(200).json({
      success: true,
      message: 'Estadísticas obtenidas correctamente',
      stats: mockStats,
      meta: {
        endpoint: '/api/ai-blog/stats',
        timestamp: new Date().toISOString(),
        week: currentWeek
      }
    });

  } catch (error) {
    console.error('Error en stats:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: {
        message: error.message,
        name: error.name
      },
      endpoint: '/api/ai-blog/stats'
    });
  }
}