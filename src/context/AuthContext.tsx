import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@/types';
import { authApi } from '@/services/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'skillbridge_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { user: User; token: string };
        setUser(parsed.user);
        setToken(parsed.token);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = (u: User | null, t: string | null) => {
    if (u && t) localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u, token: t }));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { user: u, token: t } = await authApi.login(email, password);
      setUser(u);
      setToken(t);
      persist(u, t);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de la connexion.');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const register = async (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const { user: u, token: t } = await authApi.register(input);
      setUser(u);
      setToken(t);
      persist(u, t);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'inscription.");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    persist(null, null);
  };

  const updateUser = (patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      if (token) persist(next, token);
      return next;
    });
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, error, login, register, logout, updateUser }),
    [user, token, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
