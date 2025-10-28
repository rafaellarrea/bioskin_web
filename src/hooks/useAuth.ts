// src/hooks/useAuth.ts
// Hook para manejar autenticación de administrador

import { useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    try {
      const session = localStorage.getItem('bioskin_admin_session');
      const timestamp = localStorage.getItem('bioskin_admin_timestamp');
      
      if (session === 'authenticated' && timestamp) {
        const loginTime = parseInt(timestamp);
        const currentTime = Date.now();
        const sessionDuration = 2 * 60 * 60 * 1000; // 2 horas por seguridad
        
        if (currentTime - loginTime < sessionDuration) {
          setAuthState({ isAuthenticated: true, isLoading: false });
        } else {
          logout();
        }
      } else {
        localStorage.removeItem('bioskin_admin_session');
        localStorage.removeItem('bioskin_admin_timestamp');
        setAuthState({ isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      localStorage.clear();
      setAuthState({ isAuthenticated: false, isLoading: false });
    }
  };

  const login = (success: boolean = true) => {
    if (success) {
      setAuthState({ isAuthenticated: true, isLoading: false });
    } else {
      setAuthState({ isAuthenticated: false, isLoading: false });
    }
  };

  const logout = () => {
    // Limpiar completamente localStorage relacionado con admin
    localStorage.removeItem('bioskin_admin_session');
    localStorage.removeItem('bioskin_admin_timestamp');
    // Limpiar cualquier otra clave relacionada
    Object.keys(localStorage).forEach(key => {
      if (key.includes('bioskin') || key.includes('admin')) {
        localStorage.removeItem(key);
      }
    });
    setAuthState({ isAuthenticated: false, isLoading: false });
  };

  const forceLogout = () => {
    // Función para forzar logout completo
    localStorage.clear();
    setAuthState({ isAuthenticated: false, isLoading: false });
  };

  return {
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    login,
    logout,
    forceLogout,
    checkAuthentication
  };
};

export default useAuth;