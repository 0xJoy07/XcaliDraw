import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { updateCanvas } from '../lib/canvasApi';
import { useElementsStore } from '../store/elementsStore';
import type { AppState } from '../store/elementsStore';
import type { Element } from '../types/element';

type AuthenticatedFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

interface PendingPatch {
  elements?: Element[];
  appState?: Partial<AppState>;
}

const ELEMENT_SAVE_DELAY = 1800;
const APP_STATE_SAVE_DELAY = 900;
const RETRY_DELAY = 5000;

const draftKey = (canvasId: string) => `xcalidraw-draft:${canvasId}`;

const persistedAppState = (appState: AppState): Partial<AppState> => ({
  scrollX: appState.scrollX,
  scrollY: appState.scrollY,
  zoom: appState.zoom,
});

const appStateSignature = (appState: AppState) => {
  const persisted = persistedAppState(appState);
  return `${persisted.scrollX}:${persisted.scrollY}:${persisted.zoom}`;
};

const mergePatch = (current: PendingPatch | null, next: PendingPatch): PendingPatch => ({
  elements: next.elements ?? current?.elements,
  appState: {
    ...(current?.appState || {}),
    ...(next.appState || {}),
  },
});

export const useCanvasAutosave = (
  canvasId: string | undefined,
  enabled: boolean,
  authenticatedFetch: AuthenticatedFetch,
) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimerRef = useRef<number | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const pendingPatchRef = useRef<PendingPatch | null>(null);
  const savingRef = useRef(false);
  const statusRef = useRef<SaveStatus>('idle');
  const flushRef = useRef<() => Promise<void>>();

  const setStatus = (status: SaveStatus) => {
    statusRef.current = status;
    setSaveStatus(status);
  };

  useEffect(() => {
    if (!canvasId || !enabled) return undefined;

    const initialState = useElementsStore.getState();
    let lastElements = initialState.elements;
    let lastAppStateSignature = appStateSignature(initialState.appState);

    const clearTimer = (timerRef: MutableRefObject<number | null>) => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };

    const cacheDraft = () => {
      const state = useElementsStore.getState();
      localStorage.setItem(draftKey(canvasId), JSON.stringify({
        elements: state.elements,
        appState: persistedAppState(state.appState),
        updatedAt: new Date().toISOString(),
      }));
    };

    const flush = async () => {
      if (savingRef.current || !pendingPatchRef.current) return;

      const patch = pendingPatchRef.current;
      pendingPatchRef.current = null;
      savingRef.current = true;
      setStatus('saving');

      try {
        await updateCanvas(authenticatedFetch, canvasId, patch);
        localStorage.removeItem(draftKey(canvasId));
        setStatus('saved');
      } catch {
        pendingPatchRef.current = mergePatch(pendingPatchRef.current, patch);
        cacheDraft();
        setStatus('failed');
        clearTimer(retryTimerRef);
        retryTimerRef.current = window.setTimeout(flush, RETRY_DELAY);
      } finally {
        savingRef.current = false;
        if (pendingPatchRef.current && statusRef.current !== 'failed') {
          clearTimer(saveTimerRef);
          saveTimerRef.current = window.setTimeout(flush, ELEMENT_SAVE_DELAY);
        }
      }
    };
    
    flushRef.current = flush;

    const scheduleSave = (patch: PendingPatch, delay: number) => {
      pendingPatchRef.current = mergePatch(pendingPatchRef.current, patch);
      clearTimer(saveTimerRef);
      saveTimerRef.current = window.setTimeout(flush, delay);
      if (statusRef.current !== 'failed') setStatus('saving');
    };

    const unsubscribe = useElementsStore.subscribe((state, prevState) => {
      if (!state.dirty) return;

      if (state.elements !== prevState.elements && state.elements !== lastElements) {
        lastElements = state.elements;
        lastAppStateSignature = appStateSignature(state.appState);
        scheduleSave({
          elements: state.elements,
          appState: persistedAppState(state.appState),
        }, ELEMENT_SAVE_DELAY);
        return;
      }

      const nextAppStateSignature = appStateSignature(state.appState);
      if (nextAppStateSignature !== lastAppStateSignature) {
        lastAppStateSignature = nextAppStateSignature;
        scheduleSave({ appState: persistedAppState(state.appState) }, APP_STATE_SAVE_DELAY);
      }
    });

    return () => {
      unsubscribe();
      clearTimer(saveTimerRef);
      clearTimer(retryTimerRef);
    };
  }, [authenticatedFetch, canvasId, enabled]);

  const flushWithTimeout = async () => {
    if (!flushRef.current || !pendingPatchRef.current) return;
    try {
      // Race the flush against a 3.5s timeout
      await Promise.race([
        flushRef.current(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Flush timeout')), 3500))
      ]);
    } catch (e) {
      console.warn('Flush before navigate timed out or failed, deferring to background retry:', e);
      // We don't throw; we want navigation to proceed.
    }
  };

  return { saveStatus, flush: flushWithTimeout };
};
