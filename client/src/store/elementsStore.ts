import { create } from 'zustand';
import type { Element } from '../types/element';
import { updateRbush } from '../canvas/hitTest';
import { nanoid } from 'nanoid';

export type ToolType = 'select' | 'rectangle' | 'ellipse' | 'diamond' | 'arrow' | 'line' | 'freedraw' | 'text' | 'image' | 'eraser' | 'hand' | 'laser';

export interface AppState {
  scrollX: number;
  scrollY: number;
  zoom: number;
  selectedElementIds: string[];
  activeTool: ToolType;
  contextMenu: { x: number, y: number, type: 'canvas' | 'element' } | null;
  currentItemStyle: {
    strokeColor: string;
    backgroundColor: string;
    strokeWidth: number;
    roughness: number;
    fontFamily: string;
    fontSize: number;
    textAlign: 'left' | 'center' | 'right';
  };
  isFindOpen?: boolean;
  isHelpOpen?: boolean;
  isToolLocked?: boolean;
}

export interface ToastData {
  id: string;
  message: string;
  type?: 'info' | 'error' | 'success';
}

interface ElementsStore {
  elements: Element[];
  appState: AppState;
  dirty: boolean;
  setDirty: () => void;
  hydrateCanvas: (elements?: Element[] | null, appState?: Partial<AppState> | null) => void;
  setAppState: (state: Partial<AppState>) => void;
  addElement: (element: Element) => void;
  updateElement: (id: string, updates: Partial<Element>) => void;
  history: { past: Element[][], future: Element[][] };
  addHistoryPoint: () => void;
  undo: () => void;
  redo: () => void;
  toasts: ToastData[];
  addToast: (message: string, type?: ToastData['type']) => void;
  removeToast: (id: string) => void;
}

const createInitialAppState = (): AppState => ({
  scrollX: 0,
  scrollY: 0,
  zoom: 1,
  selectedElementIds: [],
  activeTool: 'select',
  contextMenu: null,
  currentItemStyle: {
    strokeColor: '#000000',
    backgroundColor: 'transparent',
    strokeWidth: 1,
    roughness: 1,
    fontFamily: 'sans-serif',
    fontSize: 20,
    textAlign: 'left'
  },
  isFindOpen: false,
  isHelpOpen: false,
  isToolLocked: false
});

updateRbush([]);

export const useElementsStore = create<ElementsStore>((set) => ({
  elements: [],
  appState: createInitialAppState(),
  dirty: true,
  setDirty: () => set({ dirty: true }),
  hydrateCanvas: (elements, appState) => set(() => {
    const nextElements = elements || [];
    updateRbush(nextElements);
    return {
      elements: nextElements,
      appState: {
        ...createInitialAppState(),
        ...(appState || {}),
        selectedElementIds: [],
        contextMenu: null,
      },
      history: { past: [], future: [] },
      dirty: true,
    };
  }),
  setAppState: (newState) => set((state) => ({ appState: { ...state.appState, ...newState }, dirty: true })),
  addElement: (element) => set((state) => {
    const newElements = [...state.elements, element];
    updateRbush(newElements);
    return { elements: newElements, dirty: true };
  }),
  updateElement: (id, updates) => set((state) => {
    const newElements = state.elements.map((el) => el.id === id ? { ...el, ...updates } : el);
    updateRbush(newElements);
    return { elements: newElements, dirty: true };
  }),
  history: { past: [], future: [] },
  addHistoryPoint: () => set((state) => {
    return {
      history: {
        past: [...state.history.past, state.elements],
        future: []
      }
    };
  }),
  undo: () => set((state) => {
    if (state.history.past.length === 0) return state;
    const previous = state.history.past[state.history.past.length - 1];
    const newPast = state.history.past.slice(0, -1);
    updateRbush(previous);
    return {
      elements: previous,
      history: { past: newPast, future: [state.elements, ...state.history.future] },
      dirty: true,
      appState: { ...state.appState, selectedElementIds: [] } // Clear selection on undo
    };
  }),
  redo: () => set((state) => {
    if (state.history.future.length === 0) return state;
    const next = state.history.future[0];
    const newFuture = state.history.future.slice(1);
    updateRbush(next);
    return {
      elements: next,
      history: { past: [...state.history.past, state.elements], future: newFuture },
      dirty: true,
      appState: { ...state.appState, selectedElementIds: [] } // Clear selection on redo
    };
  }),
  toasts: [],
  addToast: (message, type = 'info') => set((state) => {
    const id = nanoid();
    // Auto-remove after 3 seconds
    setTimeout(() => {
      useElementsStore.getState().removeToast(id);
    }, 3000);
    return { toasts: [...state.toasts, { id, message, type }] };
  }),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  }))
}));
