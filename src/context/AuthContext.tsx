import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface AuthUser {
  id?: number;
  username: string;
  full_name?: string;
  role: 'master_admin' | 'clinic_admin' | 'clinic_user';
  clinic_id: number | null;
  access_scope: 'all' | 'own';
}

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  user: AuthUser | null;
  features: string[];
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  hasFeature: (feature: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LS_TOKEN  = 'adminSessionToken';
const LS_USER   = 'adminUser';
const LS_EXPIRY = 'adminSessionExpiry';

function persistAuth(token: string, user: AuthUser, expiry: string, features: string[]) {
  localStorage.setItem(LS_TOKEN,  token);
  localStorage.setItem(LS_USER,   JSON.stringify({ ...user, features }));
  localStorage.setItem(LS_EXPIRY, expiry);
}

function clearAuth() {
  localStorage.removeItem(LS_TOKEN);
  localStorage.removeItem(LS_USER);
  localStorage.removeItem(LS_EXPIRY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [features, setFeatures] = useState<string[]>([]);

  const applySession = (u: AuthUser, feat: string[]) => {
    setIsAuthenticated(true);
    setUser(u);
    setFeatures(feat);
  };

  const resetSession = () => {
    setIsAuthenticated(false);
    setUser(null);
    setFeatures([]);
  };

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem(LS_TOKEN);
      if (!token) { resetSession(); return false; }

      const res  = await fetch('/api/admin-auth?action=verify', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();

      if (data.success && data.valid && data.user) {
        applySession(data.user, data.features || []);
        return true;
      }
      clearAuth(); resetSession(); return false;
    } catch {
      resetSession(); return false;
    }
  }, []);

  const login = async (username: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res  = await fetch('/api/admin-auth?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success && data.user) {
        persistAuth(data.sessionToken, data.user, data.expiresAt, data.features || []);
        applySession(data.user, data.features || []);
        return { ok: true };
      }
      return { ok: false, error: data.error || 'Credenciales inválidas' };
    } catch {
      return { ok: false, error: 'Error de conexión' };
    }
  };

  const logout = () => {
    const token = localStorage.getItem(LS_TOKEN);
    if (token) {
      fetch('/api/admin-auth?action=logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ sessionToken: token })
      }).catch(() => {});
    }
    clearAuth();
    resetSession();
  };

  const hasFeature = (feature: string) =>
    user?.role === 'master_admin' || features.includes(feature);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      username: user?.username ?? null,
      user,
      features,
      login,
      logout,
      checkAuth,
      hasFeature
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
