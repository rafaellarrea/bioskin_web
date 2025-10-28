// src/components/AdminDashboard.tsx
// Panel principal de administración con múltiples opciones

import React, { useState } from 'react';
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
  Clock
} from 'lucide-react';
import useAnalytics from '../hooks/useAnalytics';
import AdminAppointment from './AdminAppointment';

interface AdminOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  available: boolean;
}

const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('dashboard');
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
      description: 'Administrar citas y horarios',
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-green-500',
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