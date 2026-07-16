export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  authProvider: 'local' | 'google' | 'github';
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface ApiError extends Error {
  status?: number;
  details?: unknown;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.message || 'Request failed') as ApiError;
    error.status = response.status;
    error.details = body;
    throw error;
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
};

let refreshPromise: Promise<AuthResponse> | null = null;

export const authApi = {
  login: (email: string, password: string) => request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  register: (email: string, password: string, name?: string) => request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  }),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  refresh: () => {
    if (refreshPromise) return refreshPromise;
    refreshPromise = request<AuthResponse>('/api/auth/refresh', { method: 'POST' }).finally(() => {
      refreshPromise = null;
    });
    return refreshPromise;
  },
  me: (accessToken: string) => request<{ user: AuthUser }>('/api/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  }),
  providerUrl: (provider: 'google' | 'github') => `${API_URL}/api/auth/${provider}`,
};

export const createAuthenticatedFetch = (
  getAccessToken: () => string | null,
  refreshSession: () => Promise<string | null>,
) => {
  return async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const run = async (token: string | null) => fetch(input, {
      ...init,
      credentials: 'include',
      headers: {
        ...init.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    let response = await run(getAccessToken());
    if (response.status !== 401) return response;

    const freshToken = await refreshSession();
    if (!freshToken) return response;

    response = await run(freshToken);
    return response;
  };
};
