// api/analytics.js
// Endpoint para obtener estadísticas de analytics personalizadas

export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Obtener estadísticas
      const stats = await getAnalyticsStats();
      return res.status(200).json(stats);
    }

    if (req.method === 'POST') {
      // Registrar evento
      const { type, data } = req.body;
      await recordAnalyticsEvent(type, data);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error en analytics:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Simular base de datos en memoria (en producción usarías una DB real)
let analyticsData = {
  pageViews: {
    total: 0,
    daily: {},
    hourly: Array(24).fill(0).reduce((acc, _, i) => ({ ...acc, [i]: 0 }), {})
  },
  sessions: {
    total: 0,
    daily: {},
    uniqueVisitors: new Set()
  },
  events: [],
  startDate: new Date().toISOString()
};

async function recordAnalyticsEvent(type, data) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentHour = now.getHours();
  
  // Generar ID de visitante único (simulado)
  const visitorId = data.visitorId || `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Registrar page view
  if (type === 'page_view') {
    analyticsData.pageViews.total += 1;
    analyticsData.pageViews.daily[today] = (analyticsData.pageViews.daily[today] || 0) + 1;
    analyticsData.pageViews.hourly[currentHour] = (analyticsData.pageViews.hourly[currentHour] || 0) + 1;
    
    // Contar sesión única por día
    const sessionKey = `${visitorId}_${today}`;
    if (!analyticsData.sessions.uniqueVisitors.has(sessionKey)) {
      analyticsData.sessions.uniqueVisitors.add(sessionKey);
      analyticsData.sessions.total += 1;
      analyticsData.sessions.daily[today] = (analyticsData.sessions.daily[today] || 0) + 1;
    }
  }
  
  // Registrar evento
  analyticsData.events.push({
    type,
    data: { ...data, visitorId },
    timestamp: now.toISOString()
  });
  
  // Limpiar eventos antiguos (mantener solo últimos 1000)
  if (analyticsData.events.length > 1000) {
    analyticsData.events = analyticsData.events.slice(-1000);
  }
}

async function getAnalyticsStats() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Calcular estadísticas de la semana actual
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  let thisWeekViews = 0;
  let thisWeekSessions = 0;
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    thisWeekViews += analyticsData.pageViews.daily[dateStr] || 0;
    thisWeekSessions += analyticsData.sessions.daily[dateStr] || 0;
  }

  // Calcular estadísticas del mes actual
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const monthDays = Object.keys(analyticsData.pageViews.daily)
    .filter(day => day.startsWith(monthKey));
  
  const thisMonthViews = monthDays.reduce((sum, day) => 
    sum + (analyticsData.pageViews.daily[day] || 0), 0);
  const thisMonthSessions = monthDays.reduce((sum, day) => 
    sum + (analyticsData.sessions.daily[day] || 0), 0);

  // Páginas más visitadas (últimos 7 días)
  const recentEvents = analyticsData.events
    .filter(event => {
      const eventDate = new Date(event.timestamp);
      const daysAgo = (now - eventDate) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7 && event.type === 'page_view';
    });

  const pageViews = {};
  recentEvents.forEach(event => {
    const page = event.data.page || 'Página desconocida';
    pageViews[page] = (pageViews[page] || 0) + 1;
  });

  const topPages = Object.entries(pageViews)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([page, views]) => ({ page, views }));

  // Distribución horaria (últimos 7 días)
  const hourlyStats = { ...analyticsData.pageViews.hourly };

  return {
    total: {
      pageViews: analyticsData.pageViews.total,
      sessions: analyticsData.sessions.total,
      uniqueVisitors: analyticsData.sessions.uniqueVisitors.size
    },
    today: {
      pageViews: analyticsData.pageViews.daily[today] || 0,
      sessions: analyticsData.sessions.daily[today] || 0
    },
    yesterday: {
      pageViews: analyticsData.pageViews.daily[yesterdayStr] || 0,
      sessions: analyticsData.sessions.daily[yesterdayStr] || 0
    },
    thisWeek: {
      pageViews: thisWeekViews,
      sessions: thisWeekSessions
    },
    thisMonth: {
      pageViews: thisMonthViews,
      sessions: thisMonthSessions
    },
    topPages,
    hourlyDistribution: hourlyStats,
    realtimeVisitors: getRealtimeVisitors(),
    lastUpdated: now.toISOString()
  };
}

function getRealtimeVisitors() {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  const recentEvents = analyticsData.events
    .filter(event => new Date(event.timestamp) > fiveMinutesAgo)
    .filter(event => event.type === 'page_view');
  
  const uniqueVisitors = new Set(recentEvents.map(event => event.data.visitorId));
  
  return uniqueVisitors.size;
}