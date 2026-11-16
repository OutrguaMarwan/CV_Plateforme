import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
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

interface StoredSession {
  user: User;
  token: string;
  refresh?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = 'skillbridge_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          'user' in parsed &&
          'token' in parsed &&
          typeof parsed.token === 'string'
        ) {
          setUser(parsed.user as User);
          setToken(parsed.token);
          if ('refresh' in parsed && typeof parsed.refresh === 'string') {
            setRefresh(parsed.refresh);
          }
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const onTokensRefreshed = (event: Event) => {
      const detail = (event as CustomEvent<{ token: string; refresh?: string }>).detail;
      setToken(detail.token);
      if (detail.refresh) setRefresh(detail.refresh);
    };

    const onSessionExpired = () => {
      setUser(null);
      setToken(null);
      setRefresh(null);
      setError('Votre session a expiré. Veuillez vous reconnecter.');
    };

    window.addEventListener('skillbridge:tokens-refreshed', onTokensRefreshed);
    window.addEventListener('skillbridge:session-expired', onSessionExpired);

    return () => {
      window.removeEventListener('skillbridge:tokens-refreshed', onTokensRefreshed);
      window.removeEventListener('skillbridge:session-expired', onSessionExpired);
    };
  }, []);

  const persist = (
    currentUser: User | null,
    currentToken: string | null,
    currentRefresh: string | null,
  ) => {
    if (currentUser && currentToken) {
      const session: StoredSession = {
        user: currentUser,
        token: currentToken,
        ...(currentRefresh ? { refresh: currentRefresh } : {}),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authApi.login(email, password);
      setUser(result.user);
      setToken(result.token);
      setRefresh(result.refresh);
      persist(result.user, result.token, result.refresh);
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
      await authApi.register(input);
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
    setRefresh(null);
    setError(null);
    persist(null, null, null);
  };

  const updateUser = (patch: Partial<User>) => {
    setUser((previousUser) => {
      if (!previousUser) return previousUser;

      const updatedUser = { ...previousUser, ...patch };
      persist(updatedUser, token, refresh);
      return updatedUser;
    });
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, error, login, register, logout, updateUser }),
    [user, token, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}