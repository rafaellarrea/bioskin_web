import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';

export default function AdminMonitor() {
  const navigate = useNavigate();
  const { isAuthenticated, checkAuth } = useAuth();

  useEffect(() => {
    const verifyAuth = async () => {
      const authenticated = await checkAuth();
      if (!authenticated) {
        navigate('/admin/login');
      }
    };
    verifyAuth();
  }, [checkAuth, navigate]);

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
              <h1 className="text-2xl font-bold text-gray-900">Monitor de Actividad</h1>
              <p className="text-gray-600">Visualización en tiempo real de webhooks y actividad del chatbot</p>
            </div>
          </div>
        </div>
      </div>

      {/* Iframe con el monitor HTML existente */}
      <div className="container-custom py-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <iframe
            src="/chatbot-monitor.html"
            className="w-full h-full border-0"
            title="Monitor de Actividad del Chatbot"
          />
        </div>
      </div>
    </div>
  );
}
