import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, BarChart3, TrendingUp, LogOut, User, Calendar, Clock, Ban, Bell, X, AlertCircle, Brain, Zap, ClipboardList, Bot, Package, Activity, Mail } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

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

  // Health Check States
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthLogs, setHealthLogs] = useState<string[]>([]);
  const [calStatus, setCalStatus] = useState<'pending' | 'loading' | 'success' | 'error'>('pending');
  const [emailStatus, setEmailStatus] = useState<'pending' | 'loading' | 'success' | 'error'>('pending');
  const healthLogsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (healthLogsEndRef.current) {
        healthLogsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [healthLogs]);

  const runTest = async (type: 'calendar' | 'email') => {
    const isCalendar = type === 'calendar';
    const setStatus = isCalendar ? setCalStatus : setEmailStatus;
    const endpoint = isCalendar ? '/api/test-calendar' : '/api/test-email';

    setStatus('loading');
    setHealthLogs(prev => [...prev, `\n> Iniciando prueba de ${type}...`]);

    try {
        const res = await fetch(endpoint);
        const data = await res.json();
        
        if (data.logs) {
            setHealthLogs(prev => [...prev, ...data.logs.map((l: string) => `> ${l}`)]);
        }

        if (data.success) {
            setStatus('success');
            setHealthLogs(prev => [...prev, `> ✅ PRUEBA EXITOSA`]);
        } else {
            setStatus('error');
            setHealthLogs(prev => [...prev, `> ❌ ERROR: ${data.message}`]);
            if(data.error) setHealthLogs(prev => [...prev, `> Detalle: ${data.error}`]);
            
            // Special Advice
            if(type === 'email' && (data.code === 'EAUTH' || (data.response && data.response.includes('BadCredentials')))) {
                 setHealthLogs(prev => [...prev, `> 💡 CONSEJO: Error de autenticación. Verifica la App Password de Gmail o la Autenticación de 2 Pasos.`]);
            }
        }
    } catch (e: any) {
        setStatus('error');
        setHealthLogs(prev => [...prev, `> ❌ Error de comunicación: ${e.message}`]);
    }
  };

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
    },
    {
      title: 'Diagnóstico IA',
      description: 'Herramienta de análisis dermatológico asistido por IA',
      icon: Brain,
      path: '/admin/diagnosis',
      color: 'from-teal-500 to-teal-600'
    },
    {
      title: 'Protocolos Clínicos',
      description: 'Asistente IA para protocolos de aparatología médica',
      icon: Zap,
      path: '/admin/protocols',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      title: 'Asistente de Respuestas',
      description: 'IA Gema para redactar respuestas a pacientes',
      icon: Bot,
      path: '/admin/chat-assistant',
      color: 'from-pink-500 to-rose-500'
    },
    {
      title: 'Fichas Clínicas',
      description: 'Gestión de pacientes, antecedentes y tratamientos',
      icon: ClipboardList,
      path: '/admin/clinical-records',
      color: 'from-pink-500 to-pink-600'
    },
    {
      title: 'Inventario',
      description: 'Control de stock, lotes y vencimientos',
      icon: Package,
      path: '/admin/inventory',
      color: 'from-cyan-500 to-cyan-600'
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

          {/* System Health Card */}
          <button
            onClick={() => setShowHealthModal(true)}
            className="group relative bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-10 transition-opacity" />
            
            <div className="relative p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-6">
                <Activity className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#deb887] transition-colors">
                Estado del Sistema
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                Verificar conexión con Google Calendar y Servicio de Correo
              </p>

              <div className="mt-6 flex items-center text-[#deb887] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Verificar</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Health Check Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-auto overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                   <Activity className="w-6 h-6 text-emerald-600" />
                   Diagnóstico del Sistema
                </h3>
                <button onClick={() => setShowHealthModal(false)} className="text-gray-400 hover:text-gray-600">
                   <X className="w-6 h-6" />
                </button>
             </div>

             <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   {/* Calendar Status */}
                   <div className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                         <Calendar className="w-4 h-4" /> Google Calendar
                      </h4>
                      <div className="flex items-center gap-2 mb-3">
                         <span className={`h-3 w-3 rounded-full ${
                             calStatus === 'success' ? 'bg-green-500' :
                             calStatus === 'error' ? 'bg-red-500' :
                             calStatus === 'loading' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300'
                         }`}></span>
                         <span className="text-sm font-medium">
                            {calStatus === 'success' ? 'Conectado' :
                             calStatus === 'error' ? 'Error' :
                             calStatus === 'loading' ? 'Verificando...' : 'Pendiente'}
                         </span>
                      </div>
                      <button 
                         onClick={() => runTest('calendar')}
                         disabled={calStatus === 'loading' || emailStatus === 'loading'}
                         className="w-full py-2 bg-white border border-gray-200 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50 text-gray-700"
                      >
                         Probar Conexión
                      </button>
                   </div>

                   {/* Email Status */}
                   <div className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                         <Mail className="w-4 h-4" /> Email Service
                      </h4>
                       <div className="flex items-center gap-2 mb-3">
                         <span className={`h-3 w-3 rounded-full ${
                             emailStatus === 'success' ? 'bg-green-500' :
                             emailStatus === 'error' ? 'bg-red-500' :
                             emailStatus === 'loading' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300'
                         }`}></span>
                         <span className="text-sm font-medium">
                            {emailStatus === 'success' ? 'Operativo' :
                             emailStatus === 'error' ? 'Fallo' :
                             emailStatus === 'loading' ? 'Enviando...' : 'Pendiente'}
                         </span>
                      </div>
                      <button 
                         onClick={() => runTest('email')}
                         disabled={calStatus === 'loading' || emailStatus === 'loading'}
                         className="w-full py-2 bg-white border border-gray-200 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50 text-gray-700"
                      >
                         Probar Envío
                      </button>
                   </div>
                </div>

                {/* Logs Console */}
                <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm max-h-60 overflow-y-auto">
                   <div className="text-gray-400 border-b border-gray-700 pb-2 mb-2 flex justify-between">
                      <span>Console Output</span>
                      <button onClick={() => setHealthLogs([])} className="text-xs hover:text-white">Clear</button>
                   </div>
                   <div className="space-y-1">
                      {healthLogs.length === 0 && <span className="text-gray-600 italic">Esperando pruebas...</span>}
                      {healthLogs.map((log, i) => (
                         <div key={i} className={`${
                             log.includes('❌') ? 'text-red-400' :
                             log.includes('✅') ? 'text-green-400' :
                             log.includes('💡') ? 'text-yellow-300' : 'text-gray-300'
                         }`}>
                            {log}
                         </div>
                      ))}
                      <div ref={healthLogsEndRef} />
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
