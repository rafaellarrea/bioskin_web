import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  const checkAuth = async (): Promise<boolean> => {
    try {
      const sessionToken = localStorage.getItem('adminSessionToken');
      if (!sessionToken) {
        setIsAuthenticated(false);
        setUsername(null);
        return false;
      }

      // Verificar sesión con el API
      const response = await fetch('/api/admin-auth?action=verify', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      const data = await response.json();

      if (data.success && data.valid) {
        const savedUsername = localStorage.getItem('adminUsername');
        setIsAuthenticated(true);
        setUsername(savedUsername || data.user?.username || 'admin');
        return true;
      } else {
        // Sesión inválida, limpiar
        localStorage.removeItem('adminSessionToken');
        localStorage.removeItem('adminUsername');
        setIsAuthenticated(false);
        setUsername(null);
        return false;
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      setIsAuthenticated(false);
      setUsername(null);
      return false;
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Intentando login con API...');
      
      const response = await fetch('/api/admin-auth?action=login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      console.log('📊 Respuesta del API:', data);

      if (data.success) {
        // Guardar sesión
        localStorage.setItem('adminSessionToken', data.sessionToken);
        localStorage.setItem('adminUsername', data.user?.username || username);
        localStorage.setItem('adminSessionExpiry', data.expiresAt);
        
        setIsAuthenticated(true);
        setUsername(data.user?.username || username);
        
        console.log('✅ Login exitoso');
        return true;
      } else {
        console.error('❌ Login fallido:', data.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      return false;
    }
  };

  const logout = () => {
    const sessionToken = localStorage.getItem('adminSessionToken');
    
    // Intentar cerrar sesión en el servidor
    if (sessionToken) {
      fetch('/api/admin-auth?action=logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ sessionToken })
      }).catch(err => console.error('Error cerrando sesión en servidor:', err));
    }
    
    // Limpiar local
    localStorage.removeItem('adminSessionToken');
    localStorage.removeItem('adminUsername');
    localStorage.removeItem('adminSessionExpiry');
    setIsAuthenticated(false);
    setUsername(null);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
