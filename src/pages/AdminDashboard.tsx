import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, BarChart3, TrendingUp, LogOut, User, Calendar, Clock, Ban } from 'lucide-react';
import { useEffect } from 'react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, username, logout, checkAuth } = useAuth();

  useEffect(() => {
    const verifyAuth = async () => {
      const authenticated = await checkAuth();
      if (!authenticated) {
        navigate('/admin/login');
      }
    };
    verifyAuth();
  }, [checkAuth, navigate]);

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
