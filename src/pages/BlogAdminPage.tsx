// src/pages/BlogAdminPage.tsx
// Página de administración de blogs con autenticación

import React from 'react';
import { LogOut } from 'lucide-react';
import BlogAdmin from '../components/BlogAdmin';
import AdminLogin from '../components/AdminLogin';
import useAuth from '../hooks/useAuth';

const BlogAdminPage: React.FC = () => {
  const { isAuthenticated, isLoading, login, logout } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#deb887] mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Login screen
  if (!isAuthenticated) {
    return <AdminLogin onLogin={login} />;
  }

  // Authenticated admin interface
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header with logout */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Panel de Administración BIOSKIN
            </h1>
            <p className="text-gray-600">
              Gestión de contenido y configuraciones del sitio web
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
        
        <BlogAdmin />
        
        {/* Acceso Rápido */}
        <div className="max-w-4xl mx-auto mt-8 grid md:grid-cols-3 gap-4">
          <a
            href="/#/blogs"
            className="block p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-center"
          >
            <h3 className="font-semibold text-gray-800 mb-2">Ver Blogs</h3>
            <p className="text-sm text-gray-600">Revisar blogs publicados</p>
          </a>
          
          <a
            href="/#/blogs"
            className="block p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-center"
          >
            <h3 className="font-semibold text-gray-800 mb-2">Estadísticas</h3>
            <p className="text-sm text-gray-600">Métricas de rendimiento</p>
          </a>
          
          <a
            href="/#/"
            className="block p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-center"
          >
            <h3 className="font-semibold text-gray-800 mb-2">Sitio Principal</h3>
            <p className="text-sm text-gray-600">Ir al sitio público</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default BlogAdminPage;