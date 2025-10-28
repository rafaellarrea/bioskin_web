// src/components/AdminDashboard.tsx
// Panel principal de administración con múltiples opciones

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  Calendar, 
  BarChart3, 
  Mail, 
  Image, 
  Database,
  Monitor,
  Shield,
  Eye,
  TrendingUp,
  Clock,
  Bell,
  X,
  AlertCircle,
  CalendarDays
} from 'lucide-react';
import useAnalytics from '../hooks/useAnalytics';
import AdminAppointment from './AdminAppointment';
import AdminCalendar from './AdminCalendar';

interface AdminOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  available: boolean;
}

interface UpcomingAppointment {
  id: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
  daysUntil: number;
  isToday: boolean;
  isTomorrow: boolean;
}

const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const { 
    stats, 
    dailyStats, 
    weeklyStats, 
    monthlyStats, 
    isLoading, 
    getBounceRate, 
    getGrowthRate,
    getPeakHours 
  } = useAnalytics();

  // Función para obtener citas de los próximos 15 días
  const fetchUpcomingAppointments = async () => {
    setLoadingNotifications(true);
    try {
      console.log('🔔 Cargando notificaciones de citas próximas...');
      
      const appointments: UpcomingAppointment[] = [];
      const today = new Date();
      
      // Obtener eventos para los próximos 15 días
      for (let i = 0; i <= 15; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);
        const dateString = currentDate.toISOString().split('T')[0];
        
        try {
          const response = await fetch('/api/getEvents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: dateString }),
          });
          
          const data = await response.json();
          
          if (data.events && Array.isArray(data.events)) {
            data.events.forEach((event: any) => {
              appointments.push({
                id: event.id,
                summary: event.summary,
                start: event.start,
                end: event.end,
                description: event.description,
                daysUntil: i,
                isToday: i === 0,
                isTomorrow: i === 1
              });
            });
          }
        } catch (err) {
          console.error(`Error fetching events for ${dateString}:`, err);
        }
      }
      
      // Ordenar por fecha/hora
      appointments.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      
      console.log(`✅ ${appointments.length} citas próximas encontradas`);
      setUpcomingAppointments(appointments);
      
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Cargar notificaciones al entrar al dashboard
  useEffect(() => {
    fetchUpcomingAppointments();
  }, []);

  // Cerrar notificaciones al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showNotifications && !target.closest('.notifications-panel')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  // Función para formatear la fecha/hora de la cita
  const formatAppointmentDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    const day = date.toLocaleDateString('es-ES', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    return { time, day };
  };

  // Obtener mensaje de urgencia para la cita
  const getUrgencyMessage = (appointment: UpcomingAppointment) => {
    if (appointment.isToday) {
      return { 
        text: 'HOY', 
        color: 'bg-red-500 text-white',
        priority: 1 
      };
    }
    if (appointment.isTomorrow) {
      return { 
        text: 'MAÑANA', 
        color: 'bg-orange-500 text-white',
        priority: 2 
      };
    }
    if (appointment.daysUntil <= 3) {
      return { 
        text: `${appointment.daysUntil} días`, 
        color: 'bg-yellow-500 text-white',
        priority: 3 
      };
    }
    if (appointment.daysUntil <= 7) {
      return { 
        text: `${appointment.daysUntil} días`, 
        color: 'bg-blue-500 text-white',
        priority: 4 
      };
    }
    return { 
      text: `${appointment.daysUntil} días`, 
      color: 'bg-gray-500 text-white',
      priority: 5 
    };
  };

  const adminOptions: AdminOption[] = [
    {
      id: 'analytics',
      title: 'Analíticas Detalladas',
      description: 'Estadísticas completas de visitas',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'bg-blue-500',
      available: true
    },
    {
      id: 'appointments',
      title: 'Gestión de Citas',
      description: 'Agendar nuevas citas y horarios',
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-green-500',
      available: true
    },
    {
      id: 'calendar',
      title: 'Visualizar Agenda',
      description: 'Ver citas programadas del calendario',
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-blue-500',
      available: true
    },
    {
      id: 'users',
      title: 'Gestión de Usuarios',
      description: 'Administrar pacientes y personal',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-purple-500',
      available: false
    },
    {
      id: 'analytics',
      title: 'Analíticas',
      description: 'Estadísticas y métricas del sitio',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'bg-orange-500',
      available: false
    },
    {
      id: 'email',
      title: 'Marketing por Email',
      description: 'Campañas y newsletters',
      icon: <Mail className="w-6 h-6" />,
      color: 'bg-pink-500',
      available: false
    },
    {
      id: 'media',
      title: 'Gestión de Medios',
      description: 'Imágenes y archivos multimedia',
      icon: <Image className="w-6 h-6" />,
      color: 'bg-yellow-500',
      available: false
    },
    {
      id: 'database',
      title: 'Base de Datos',
      description: 'Backup y mantenimiento',
      icon: <Database className="w-6 h-6" />,
      color: 'bg-red-500',
      available: false
    },
    {
      id: 'monitoring',
      title: 'Monitoreo',
      description: 'Performance y logs del sistema',
      icon: <Monitor className="w-6 h-6" />,
      color: 'bg-indigo-500',
      available: false
    },
    {
      id: 'security',
      title: 'Seguridad',
      description: 'Configuración de acceso y permisos',
      icon: <Shield className="w-6 h-6" />,
      color: 'bg-gray-500',
      available: false
    },
    {
      id: 'settings',
      title: 'Configuración',
      description: 'Ajustes generales del sitio',
      icon: <Settings className="w-6 h-6" />,
      color: 'bg-teal-500',
      available: false
    }
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'appointments':
        return (
          <AdminAppointment onBack={() => setActiveSection('dashboard')} />
        );
      case 'calendar':
        return (
          <AdminCalendar onBack={() => setActiveSection('dashboard')} />
        );
      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Analíticas Detalladas</h2>
              <button 
                onClick={() => setActiveSection('dashboard')}
                className="text-[#deb887] hover:text-[#d4a574] font-medium"
              >
                ← Volver al Dashboard
              </button>
            </div>

            {/* Estadísticas por período */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Últimos 7 días */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Últimos 7 Días</h3>
                <div className="space-y-3">
                  {dailyStats.slice(-7).map((day, index) => (
                    <div key={day.date} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {new Date(day.date).toLocaleDateString('es-ES', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                      <div className="flex gap-4">
                        <span className="text-sm font-medium">{day.pageViews}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-[#deb887] h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, (day.pageViews / Math.max(...dailyStats.slice(-7).map(d => d.pageViews), 1)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Últimas 8 semanas */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Últimas 8 Semanas</h3>
                <div className="space-y-3">
                  {weeklyStats.slice(-8).map((week, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 truncate">
                        Semana {8 - index}
                      </span>
                      <div className="flex gap-4">
                        <span className="text-sm font-medium">{week.pageViews}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, (week.pageViews / Math.max(...weeklyStats.slice(-8).map(w => w.pageViews), 1)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Horarios pico */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Horarios Pico</h3>
                <div className="space-y-3">
                  {!isLoading && getPeakHours().map((peak, index) => (
                    <div key={peak.hour} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{peak.time}</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-sm font-medium">{peak.views}</span>
                        <div className="w-12 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, (peak.views / Math.max(...getPeakHours().map(p => p.views), 1)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Métricas adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Bounce Rate</h4>
                <p className="text-3xl font-bold text-gray-900">{isLoading ? '...' : getBounceRate()}%</p>
                <p className="text-xs text-gray-500 mt-1">Tasa de rebote</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Sesiones Totales</h4>
                <p className="text-3xl font-bold text-gray-900">{isLoading ? '...' : stats?.total.sessions || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Visitas únicas</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Sesiones Hoy</h4>
                <p className="text-3xl font-bold text-gray-900">{isLoading ? '...' : stats?.today.sessions || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Visitantes únicos hoy</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Promedio Páginas/Sesión</h4>
                <p className="text-3xl font-bold text-gray-900">
                  {isLoading ? '...' : stats?.total.sessions ? 
                    Math.round((stats.total.pageViews / stats.total.sessions) * 10) / 10 : 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Páginas por visita</p>
              </div>
            </div>

            {/* Gráfico mensual simplificado */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Evolución Mensual</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {monthlyStats.slice(-6).map((month, index) => (
                  <div key={index} className="text-center">
                    <div 
                      className="w-full bg-[#deb887] rounded-lg mb-2"
                      style={{
                        height: `${Math.max(20, (month.pageViews / Math.max(...monthlyStats.slice(-6).map(m => m.pageViews), 1)) * 100)}px`
                      }}
                    ></div>
                    <p className="text-xs text-gray-600 mb-1">{month.month.split(' ')[0]}</p>
                    <p className="text-sm font-medium">{month.pageViews}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'dashboard':
      default:
        return (
          <div className="space-y-6">
            {/* Header del Dashboard con Notificaciones */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Panel Administrativo</h1>
                <p className="text-gray-600 mt-1">Gestión y monitoreo de BIOSKIN</p>
              </div>
              
              {/* Icono de Notificaciones */}
              <div className="relative notifications-panel">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow border border-gray-200"
                >
                  <Bell className="w-6 h-6 text-gray-600" />
                  {upcomingAppointments.length > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse">
                      {upcomingAppointments.length > 9 ? '9+' : upcomingAppointments.length}
                    </div>
                  )}
                </button>

                {/* Panel de Notificaciones */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-[#deb887]" />
                        Citas Próximas (15 días)
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => fetchUpcomingAppointments()}
                          disabled={loadingNotifications}
                          className="p-1 text-gray-500 hover:text-[#deb887] transition-colors"
                          title="Actualizar notificaciones"
                        >
                          <Clock className={`w-4 h-4 ${loadingNotifications ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="p-6 text-center">
                          <Clock className="w-8 h-8 text-[#deb887] animate-spin mx-auto mb-2" />
                          <p className="text-gray-600">Cargando citas...</p>
                        </div>
                      ) : upcomingAppointments.length === 0 ? (
                        <div className="p-6 text-center">
                          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No hay citas próximas</p>
                          <p className="text-sm text-gray-400 mt-1">en los próximos 15 días</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {upcomingAppointments.slice(0, 10).map((appointment, index) => {
                            const urgency = getUrgencyMessage(appointment);
                            const { time, day } = formatAppointmentDateTime(appointment.start);
                            
                            return (
                              <div key={appointment.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${urgency.color}`}>
                                        {urgency.text}
                                      </span>
                                      <span className="text-sm font-medium text-gray-800">
                                        {time}
                                      </span>
                                    </div>
                                    <h4 className="font-semibold text-gray-800 mb-1">
                                      {appointment.summary}
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-2">
                                      {day}
                                    </p>
                                    {appointment.description && (
                                      <p className="text-xs text-gray-500 line-clamp-2">
                                        {appointment.description.split('\n')[0]}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex-shrink-0">
                                    {appointment.isToday && (
                                      <AlertCircle className="w-5 h-5 text-red-500" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          
                          {upcomingAppointments.length > 10 && (
                            <div className="p-4 text-center bg-gray-50">
                              <p className="text-sm text-gray-600">
                                +{upcomingAppointments.length - 10} citas más...
                              </p>
                              <button
                                onClick={() => setActiveSection('calendar')}
                                className="text-[#deb887] hover:text-[#d4a574] font-medium text-sm mt-1"
                              >
                                Ver calendario completo
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          setActiveSection('calendar');
                        }}
                        className="w-full text-center text-[#deb887] hover:text-[#d4a574] font-medium text-sm"
                      >
                        Ver Calendario Completo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Acceso directo al generador local */}
            <div className="bg-gradient-to-r from-[#deb887] to-[#d4a574] p-6 rounded-lg text-white mb-6">
              <h3 className="text-xl font-bold mb-2">Generador de Blogs Local</h3>
              <p className="mb-4 opacity-90">Accede al sistema de generación de blogs con IA</p>
              <button
                onClick={() => window.open('http://localhost:3336', '_blank')}
                className="bg-white text-[#deb887] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Abrir Generador de Blogs
              </button>
            </div>

            {/* Resumen de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Visitas Hoy</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoading ? '...' : stats?.today.pageViews || 0}
                    </p>
                    {!isLoading && (
                      <p className="text-xs text-gray-500 mt-1">
                        {getGrowthRate('daily') > 0 ? '+' : ''}{getGrowthRate('daily')}% vs ayer
                      </p>
                    )}
                  </div>
                  <Eye className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Visitas Esta Semana</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoading ? '...' : stats?.thisWeek.pageViews || 0}
                    </p>
                    {!isLoading && (
                      <p className="text-xs text-gray-500 mt-1">
                        {getGrowthRate('weekly') > 0 ? '+' : ''}{getGrowthRate('weekly')}% vs sem. pasada
                      </p>
                    )}
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Visitas Este Mes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoading ? '...' : stats?.thisMonth.pageViews || 0}
                    </p>
                    {!isLoading && (
                      <p className="text-xs text-gray-500 mt-1">
                        {getGrowthRate('monthly') > 0 ? '+' : ''}{getGrowthRate('monthly')}% vs mes pasado
                      </p>
                    )}
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Visitas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoading ? '...' : stats?.total.pageViews || 0}
                    </p>
                    {!isLoading && (
                      <p className="text-xs text-gray-500 mt-1">
                        Bounce Rate: {getBounceRate()}%
                      </p>
                    )}
                  </div>
                  <Users className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Opciones de gestión */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Opciones de Gestión</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {adminOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => option.available && setActiveSection(option.id)}
                    disabled={!option.available}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      option.available
                        ? 'border-gray-200 hover:border-[#deb887] hover:shadow-md cursor-pointer'
                        : 'border-gray-100 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${option.color} text-white`}>
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-1">{option.title}</h4>
                        <p className="text-sm text-gray-600">{option.description}</p>
                        {!option.available && (
                          <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                            Próximamente
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Actividad reciente */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Actividad Reciente</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Monitor className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Sistema funcionando correctamente</p>
                    <p className="text-xs text-gray-500">Hace 5 minutos</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Nueva cita agendada para mañana</p>
                    <p className="text-xs text-gray-500">Hace 4 horas</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Nuevo usuario registrado</p>
                    <p className="text-xs text-gray-500">Hace 6 horas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Navegación */}
      {activeSection !== 'dashboard' && (
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveSection('dashboard')}
            className="text-[#deb887] hover:text-[#d4a574] font-medium"
          >
            Dashboard
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700 font-medium">
            {adminOptions.find(opt => opt.id === activeSection)?.title || 'Sección'}
          </span>
        </div>
      )}

      {/* Contenido activo */}
      {renderActiveSection()}
    </div>
  );
};

export default AdminDashboard;