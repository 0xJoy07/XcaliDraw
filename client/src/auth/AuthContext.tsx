import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi, createAuthenticatedFetch } from '../lib/authApi';
import type { AuthUser } from '../lib/authApi';

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithProvider: (provider: 'google' | 'github') => void;
  exchangeToken: (token: string) => Promise<void>;
  refreshSession: () => Promise<string | null>;
  authenticatedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applyAuthResponse = useCallback((response: { accessToken: string; user: AuthUser }) => {
    setAccessToken(response.accessToken);
    setUser(response.user);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const response = await authApi.refresh();
      applyAuthResponse(response);
      return response.accessToken;
    } catch {
      setAccessToken(null);
      setUser(null);
      return null;
    }
  }, [applyAuthResponse]);

  useEffect(() => {
    refreshSession().finally(() => setLoading(false));
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    applyAuthResponse(response);
  }, [applyAuthResponse]);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const response = await authApi.register(email, password, name);
    applyAuthResponse(response);
  }, [applyAuthResponse]);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    setAccessToken(null);
    setUser(null);
  }, []);

  const loginWithProvider = useCallback((provider: 'google' | 'github') => {
    window.location.href = authApi.providerUrl(provider);
  }, []);

  const exchangeToken = useCallback(async (token: string) => {
    const response = await authApi.oauthExchange(token);
    applyAuthResponse(response);
  }, [applyAuthResponse]);

  const authenticatedFetch = useMemo(() => {
    return createAuthenticatedFetch(() => accessToken, refreshSession);
  }, [accessToken, refreshSession]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    accessToken,
    loading,
    login,
    register,
    logout,
    loginWithProvider,
    exchangeToken,
    refreshSession,
    authenticatedFetch,
  }), [user, accessToken, loading, login, register, logout, loginWithProvider, exchangeToken, refreshSession, authenticatedFetch]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
