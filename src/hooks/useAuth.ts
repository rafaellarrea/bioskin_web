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
        const sessionDuration = 8 * 60 * 60 * 1000; // 8 horas en milisegundos
        
        if (currentTime - loginTime < sessionDuration) {
          setAuthState({ isAuthenticated: true, isLoading: false });
        } else {
          // Sesión expirada
          logout();
        }
      } else {
        setAuthState({ isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setAuthState({ isAuthenticated: false, isLoading: false });
    }
  };

  const login = () => {
    setAuthState({ isAuthenticated: true, isLoading: false });
  };

  const logout = () => {
    localStorage.removeItem('bioskin_admin_session');
    localStorage.removeItem('bioskin_admin_timestamp');
    setAuthState({ isAuthenticated: false, isLoading: false });
  };

  return {
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    login,
    logout,
    checkAuthentication
  };
};

export default useAuth;