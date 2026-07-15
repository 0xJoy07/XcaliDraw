import type { AppState } from '../store/elementsStore';
import type { Element } from '../types/element';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface SavedCanvas {
  id: string;
  title: string;
  elements: Element[];
  appState: Partial<AppState>;
  isPublic: boolean;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
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
    body: JSON.stringify({ title }),
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
