// src/pages/BlogAdminPage.tsx
// Página de administración de blogs

import React from 'react';
import BlogAdmin from '../components/BlogAdmin';

const BlogAdminPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Panel de Administración
          </h1>
          <p className="text-gray-600">
            Gestiona y genera contenido de blogs con inteligencia artificial
          </p>
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
            <p className="text-sm text-gray-600">Volver al sitio web</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default BlogAdminPage;