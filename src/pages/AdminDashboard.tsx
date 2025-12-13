import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, BarChart3, TrendingUp, LogOut, User, Calendar, Clock, Ban, Bell, X, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, username, logout, checkAuth } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      const authenticated = await checkAuth();
      if (!authenticated) {
        navigate('/admin/login');
      }
    };
    verifyAuth();
  }, [checkAuth, navigate]);

  // Cargar notificaciones
  useEffect(() => {
    if (isAuthenticated) {
      fetchUpcomingAppointments();
    }
  }, [isAuthenticated]);

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

  const fetchUpcomingAppointments = async () => {
    setLoadingNotifications(true);
    try {
      const appointments: UpcomingAppointment[] = [];
      const today = new Date();
      
      // Obtener eventos para los próximos 15 días
      for (let i = 0; i <= 15; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);
        const dateString = currentDate.toISOString().split('T')[0];
        
        try {
          const response = await fetch('/api/calendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'getEvents',
              date: dateString 
            }),
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
      setUpcomingAppointments(appointments);
      
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

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

  const getUrgencyMessage = (appointment: UpcomingAppointment) => {
    if (appointment.isToday) {
      return { text: 'HOY', color: 'bg-red-500 text-white' };
    }
    if (appointment.isTomorrow) {
      return { text: 'MAÑANA', color: 'bg-orange-500 text-white' };
    }
    if (appointment.daysUntil <= 3) {
      return { text: `${appointment.daysUntil} días`, color: 'bg-yellow-500 text-white' };
    }
    return { text: `${appointment.daysUntil} días`, color: 'bg-gray-500 text-white' };
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  const menuItems = [
    {
      title: 'Gestión de Chats',
      description: 'Responde y administra conversaciones de WhatsApp',
      icon: MessageSquare,
      path: '/admin/chats',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Gestión de Agenda',
      description: 'Visualiza y administra citas del calendario',
      icon: Calendar,
      path: '/admin/calendar',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      title: 'Bloqueo de Horarios',
      description: 'Bloquea horarios no disponibles en el calendario',
      icon: Ban,
      path: '/admin/block-schedule',
      color: 'from-red-500 to-red-600'
    },
    {
      title: 'Agendar Cita Manual',
      description: 'Crea citas manualmente en el sistema',
      icon: Clock,
      path: '/admin/appointment',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Monitor de Actividad',
      description: 'Visualiza estadísticas y webhooks en tiempo real',
      icon: BarChart3,
      path: '/admin/monitor',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Estadísticas',
      description: 'Análisis detallado del rendimiento del chatbot',
      icon: TrendingUp,
      path: '/admin/stats',
      color: 'from-green-500 to-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel Administrativo</h1>
              <p className="text-gray-600">BIOSKIN - Gestión de Chatbot WhatsApp</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Notifications Bell */}
              <div className="relative notifications-panel">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Bell className="w-6 h-6" />
                  {upcomingAppointments.length > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white">
                      {upcomingAppointments.length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#deb887]" />
                        Próximas Citas
                      </h3>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="p-8 text-center text-gray-500">
                          <div className="animate-spin w-6 h-6 border-2 border-[#deb887] border-t-transparent rounded-full mx-auto mb-2"></div>
                          Cargando...
                        </div>
                      ) : upcomingAppointments.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {upcomingAppointments.map((apt) => {
                            const { time, day } = formatAppointmentDateTime(apt.start);
                            const urgency = getUrgencyMessage(apt);
                            
                            return (
                              <div key={apt.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${urgency.color}`}>
                                    {urgency.text}
                                  </span>
                                  <span className="text-xs text-gray-500 font-medium">{time}</span>
                                </div>
                                <h4 className="font-medium text-gray-900 mb-1">{apt.summary}</h4>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Calendar className="w-3 h-3" />
                                  <span className="capitalize">{day}</span>
                                </div>
                                {apt.description && (
                                  <p className="text-xs text-gray-500 mt-2 bg-gray-100 p-2 rounded">
                                    {apt.description}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p>No hay citas próximas</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                      <button 
                        onClick={() => navigate('/admin/calendar')}
                        className="text-sm text-[#deb887] font-medium hover:underline"
                      >
                        Ver calendario completo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-5 h-5" />
                <span className="font-medium">{username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="group relative bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                
                {/* Card Content */}
                <div className="relative p-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} mb-6`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#deb887] transition-colors">
                    {item.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Arrow indicator */}
                  <div className="mt-6 flex items-center text-[#deb887] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Acceder</span>
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
