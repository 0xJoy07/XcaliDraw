import type { AppState } from '../store/elementsStore';
import type { Element } from '../types/element';

const API_URL = import.meta.env.VITE_API_URL as string;

export type CanvasAccessRole = 'owner' | 'editor' | 'viewer' | 'none';

export interface SavedCanvas {
  id: string;
  title: string;
  elements: Element[];
  appState: Partial<AppState>;
  isPublic: boolean;
  publicRole: 'viewer' | 'editor' | null;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
  role?: CanvasAccessRole;
}

export interface CanvasSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface CanvasUpdatePayload {
  title?: string;
  elements?: Element[];
  appState?: Partial<AppState>;
}

export interface Collaborator {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'viewer' | 'editor';
}

type AuthenticatedFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const request = async <T>(
  authenticatedFetch: AuthenticatedFetch,
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await authenticatedFetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'Canvas request failed');
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
};

export const createCanvas = (authenticatedFetch: AuthenticatedFetch, title?: string) => {
  return request<{ canvas: SavedCanvas }>(authenticatedFetch, '/api/canvases', {
    method: 'POST',
    body: JSON.stringify({ title: title || 'Untitled sketch' }),
  });
};

export const getCanvas = (authenticatedFetch: AuthenticatedFetch, id: string) => {
  return request<{ canvas: SavedCanvas }>(authenticatedFetch, `/api/canvases/${id}`);
};

export const listUserCanvases = (authenticatedFetch: AuthenticatedFetch) => {
  return request<{ canvases: CanvasSummary[] }>(authenticatedFetch, '/api/canvases');
};

export const updateCanvas = (
  authenticatedFetch: AuthenticatedFetch,
  id: string,
  payload: CanvasUpdatePayload,
) => {
  return request<{ canvas: SavedCanvas }>(authenticatedFetch, `/api/canvases/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};

export const deleteCanvas = (authenticatedFetch: AuthenticatedFetch, id: string) => {
  return request<void>(authenticatedFetch, `/api/canvases/${id}`, { method: 'DELETE' });
};

// --- SHARING API ---

export const shareCanvas = (
  authenticatedFetch: AuthenticatedFetch,
  id: string,
  payload: { isPublic: boolean; publicRole: 'viewer' | 'editor' | null },
) => {
  return request<{ canvas: SavedCanvas }>(authenticatedFetch, `/api/canvases/${id}/share`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const revokeShare = (authenticatedFetch: AuthenticatedFetch, id: string) => {
  return request<{ canvas: SavedCanvas }>(authenticatedFetch, `/api/canvases/${id}/revoke`, {
    method: 'POST',
  });
};

export const addCollaborator = (
  authenticatedFetch: AuthenticatedFetch,
  id: string,
  payload: { email: string; role: 'viewer' | 'editor' },
) => {
  return request<{ collaborator: Collaborator }>(authenticatedFetch, `/api/canvases/${id}/collaborators`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const listCollaborators = (authenticatedFetch: AuthenticatedFetch, id: string) => {
  return request<{ collaborators: Collaborator[] }>(authenticatedFetch, `/api/canvases/${id}/collaborators`);
};

export const removeCollaborator = (authenticatedFetch: AuthenticatedFetch, id: string, userId: string) => {
  return request<void>(authenticatedFetch, `/api/canvases/${id}/collaborators/${userId}`, {
    method: 'DELETE',
  });
};

export const getSharedCanvas = async (
  shareToken: string,
  token?: string | null
): Promise<{ canvas: SavedCanvas }> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/canvases/shared/${shareToken}`, {
    headers
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'Failed to load shared canvas');
  }

  return response.json();
};
