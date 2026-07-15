import type { AppState } from '../store/elementsStore';

export const screenToWorld = (clientX: number, clientY: number, appState: AppState) => {
  return {
    x: (clientX - appState.scrollX) / appState.zoom,
    y: (clientY - appState.scrollY) / appState.zoom,
  };
};

export const worldToScreen = (x: number, y: number, appState: AppState) => {
  return {
    x: x * appState.zoom + appState.scrollX,
    y: y * appState.zoom + appState.scrollY,
  };
};
