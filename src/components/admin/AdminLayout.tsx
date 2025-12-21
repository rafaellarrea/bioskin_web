import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

export default function AdminLayout({ children, title, subtitle, showBack = true }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { username, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {showBack && (
                <button 
                  onClick={() => navigate('/admin')}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700 hidden md:flex">
                <User className="w-5 h-5" />
                <span className="font-medium">{username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-8">
        {children}
      </div>
    </div>
  );
}
