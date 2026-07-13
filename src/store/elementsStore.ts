import { create } from 'zustand';
import type { Element } from '../types/element';

export type ToolType = 'select' | 'rectangle' | 'ellipse' | 'diamond' | 'arrow' | 'line' | 'freedraw' | 'text' | 'image' | 'eraser' | 'hand' | 'laser';

export interface AppState {
  scrollX: number;
  scrollY: number;
  zoom: number;
  selectedElementIds: string[];
  activeTool: ToolType;
}

interface ElementsStore {
  elements: Element[];
  appState: AppState;
  dirty: boolean;
  setDirty: () => void;
  setAppState: (state: Partial<AppState>) => void;
  addElement: (element: Element) => void;
  updateElement: (id: string, updates: Partial<Element>) => void;
}

export const useElementsStore = create<ElementsStore>((set) => ({
  elements: [],
  appState: {
    scrollX: 0,
    scrollY: 0,
    zoom: 1,
    selectedElementIds: [],
    activeTool: 'select',
  },
  dirty: true,
  setDirty: () => set({ dirty: true }),
  setAppState: (newState) => set((state) => ({ appState: { ...state.appState, ...newState }, dirty: true })),
  addElement: (element) => set((state) => ({ elements: [...state.elements, element], dirty: true })),
  updateElement: (id, updates) => set((state) => ({
    elements: state.elements.map((el) => el.id === id ? { ...el, ...updates } : el),
    dirty: true
  }))
}));
