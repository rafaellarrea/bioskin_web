import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, BarChart3, MessageSquare, Clock, TrendingUp, AlertCircle } from 'lucide-react';

interface ChatbotStats {
  totalConversations?: number;
  activeConversations?: number;
  completedAppointments?: number;
  averageResponseTime?: number;
  successRate?: number;
  lastUpdate?: string;
}

export default function AdminStats() {
  const navigate = useNavigate();
  const { isAuthenticated, checkAuth } = useAuth();
  const [stats, setStats] = useState<ChatbotStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyAuth = async () => {
      const authenticated = await checkAuth();
      if (!authenticated) {
        navigate('/admin/login');
      }
    };
    verifyAuth();
  }, [checkAuth, navigate]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chatbot-api?type=stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Error al cargar estadísticas');
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/admin');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="container-custom py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Estadísticas del Chatbot</h1>
              <p className="text-gray-600">Análisis detallado del rendimiento y métricas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Content */}
      <div className="container-custom py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-white text-lg">Cargando estadísticas...</div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 text-lg">{error}</p>
            <button
              onClick={loadStats}
              className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Conversaciones */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Conversaciones</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalConversations || 0}</p>
                </div>
              </div>
            </div>

            {/* Conversaciones Activas */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Conversaciones Activas</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeConversations || 0}</p>
                </div>
              </div>
            </div>

            {/* Citas Completadas */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Citas Agendadas</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.completedAppointments || 0}</p>
                </div>
              </div>
            </div>

            {/* Tiempo Promedio de Respuesta */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Tiempo Promedio</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.averageResponseTime || 0}s</p>
                </div>
              </div>
            </div>

            {/* Tasa de Éxito */}
            <div className="bg-white rounded-2xl shadow-xl p-6 md:col-span-2">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Tasa de Éxito</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.successRate || 0}%</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${stats.successRate || 0}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {stats.lastUpdate && (
          <div className="mt-6 text-center text-gray-400 text-sm">
            Última actualización: {new Date(stats.lastUpdate).toLocaleString('es-ES')}
          </div>
        )}
      </div>
    </div>
  );
}
