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
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setIsAuthenticated(false);
        setUsername(null);
        return false;
      }

      // Verificar si el token sigue siendo válido
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = tokenData.exp * 1000;

      if (Date.now() >= expiresAt) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUsername');
        setIsAuthenticated(false);
        setUsername(null);
        return false;
      }

      const savedUsername = localStorage.getItem('adminUsername');
      setIsAuthenticated(true);
      setUsername(savedUsername);
      return true;
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      setIsAuthenticated(false);
      setUsername(null);
      return false;
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Verificar credenciales (en producción esto debería ser una llamada API)
      if (username === 'admin' && password === 'b10sk1n') {
        // Crear un token simple (en producción usar JWT real)
        const tokenPayload = {
          username,
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
        };
        const token = btoa(JSON.stringify({ header: {}, payload: tokenPayload }));
        
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUsername', username);
        setIsAuthenticated(true);
        setUsername(username);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
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
