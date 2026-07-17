import React, { useEffect, useRef } from 'react';
import { useElementsStore } from '../store/elementsStore';
import type { AppState } from '../store/elementsStore';
import { nanoid } from 'nanoid';
import type { Element, ElementType } from '../types/element';
import rough from 'roughjs';
import { renderElement, setDirtyCallback, imageCache } from './renderElement';
import { screenToWorld, worldToScreen } from '../lib/coords';
import { hitTest, hitTestHandle } from './hitTest';

// Register dirty callback so async image loads trigger re-renders
setDirtyCallback(() => useElementsStore.getState().setDirty());

// Cursor map for resize handles
const HANDLE_CURSORS: Record<string, string> = {
  nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
  e: 'e-resize', se: 'se-resize', s: 's-resize',
  sw: 'sw-resize', w: 'w-resize',
};

// ─── Text Editor Overlay ──────────────────────────────────────────────────────
const TextEditorOverlay = ({
  element,
  appState,
  onCommit,
}: {
  element: Element;
  appState: AppState;
  onCommit: (text: string) => void;
}) => {
  const [draft, setDraft] = React.useState(element.text || '');
  const taRef = React.useRef<HTMLTextAreaElement>(null);
  React.useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    const timeout = setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }, 0);
    return () => clearTimeout(timeout);
  }, []);
  React.useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.width = 'auto';
    ta.style.height = 'auto';
    ta.style.width = `${Math.max(ta.scrollWidth + 8, 120)}px`;
    ta.style.height = `${Math.max(ta.scrollHeight + 4, 32)}px`;
  }, [draft]);

  const pos = worldToScreen(element.x, element.y, appState);
  const fontSize = (element.fontSize || 20) * appState.zoom;

  const commit = () => onCommit(draft);

  return (
    <textarea
      ref={taRef}
      value={draft}
      spellCheck={false}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Escape') { e.currentTarget.blur(); }
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); }
      }}
      style={{
        position: 'fixed',
        zIndex: 300,
        left: pos.x,
        top: pos.y,
        fontSize,
        lineHeight: 1.25,
        fontFamily: element.fontFamily || 'sans-serif',
        fontWeight: element.strokeWidth === 4 ? 800 : element.strokeWidth === 2 ? 600 : 400,
        textAlign: element.textAlign || 'left',
        color: (() => {
          const c = (element.strokeColor || '').toLowerCase();
          if (c === 'transparent' || !c || c === '#000000' || c === '#1e1e1e') {
            return document.documentElement.classList.contains('dark') ? '#fff' : '#1e1e1e';
          }
          return element.strokeColor;
        })(),
        background: 'transparent',
        border: 'none',
        outline: 'none',
        resize: 'none',
        overflow: 'hidden',
        padding: 0,
        margin: 0,
        minWidth: 10,
        minHeight: fontSize * 1.25,
        whiteSpace: 'pre',
      }}
    />
  );
};

// ─── Canvas Component ─────────────────────────────────────────────────────────
export const Canvas: React.FC<{ readOnly?: boolean; isDemo?: boolean }> = ({ readOnly, isDemo }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const laserCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // interaction state
  const isPanning = useRef(false);
  const isDrawing = useRef(false);
  const isMarquee = useRef(false);
  const isErasing = useRef(false);
  const drawingElementId = useRef<string | null>(null);

  // world-space start position for current gesture
  const startWorld = useRef({ x: 0, y: 0 });
  // screen-space position for panning / marquee display
  const lastScreen = useRef({ x: 0, y: 0 });

  const isSpacePressed = useRef(false);

  // text editing — use BOTH a ref and state
  // ref: for synchronous logic inside pointer handlers
  // state: for triggering React re-render of the overlay
  const editingTextIdRef = useRef<string | null>(null);
  const [editingTextId, setEditingTextIdState] = React.useState<string | null>(null);

  const setEditingTextId = (id: string | null | ((prev: string | null) => string | null)) => {
    if (typeof id === 'function') {
      const next = id(editingTextIdRef.current);
      editingTextIdRef.current = next;
      setEditingTextIdState(next);
    } else {
      editingTextIdRef.current = id;
      setEditingTextIdState(id);
    }
  };

  // dynamic cursor state - direct DOM update for performance
  const setCursor = (cursorStr: string) => {
    if (canvasRef.current) canvasRef.current.style.cursor = cursorStr;
  };

  // drag / resize refs
  const isDraggingElems = useRef(false);
  const dragHandle = useRef<{ elementId: string; handle: string } | null>(null);
  const origElems = useRef<Record<string, Element>>({});

  // Multi-touch tracking
  const activePointers = useRef<Map<number, { clientX: number, clientY: number }>>(new Map());
  const isPinching = useRef<boolean>(false);
  const pinchInitialDist = useRef<number>(0);
  const pinchInitialZoom = useRef<number>(1);
  const pinchInitialCenter = useRef<{x: number, y: number}>({ x: 0, y: 0 });

  // laser
  const laserLines = useRef<{ points: { x: number; y: number }[]; endTime: number | null }[]>([]);

  // canvas bg lerp
  const currentBg = useRef('#f8f9fa');
  const targetBg = useRef('#f8f9fa');
  const lastThemeT = useRef(performance.now());

  // ── rAF render loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    let rafId: number;

    const parseColor = (c: string) => {
      const hex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(c.trim());
      if (hex) return { r: parseInt(hex[1], 16), g: parseInt(hex[2], 16), b: parseInt(hex[3], 16) };
      const rgb = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/i.exec(c.trim());
      if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
      return { r: 248, g: 249, b: 250 };
    };

    const lerp = (a: string, b: string, t: number) => {
      const ca = parseColor(a), cb = parseColor(b);
      return `rgb(${Math.round(ca.r + (cb.r - ca.r) * t)},${Math.round(ca.g + (cb.g - ca.g) * t)},${Math.round(ca.b + (cb.b - ca.b) * t)})`;
    };

    const render = () => {
      const state = useElementsStore.getState();
      const newTarget = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg').trim() || '#f8f9fa';
      if (newTarget !== targetBg.current) {
        targetBg.current = newTarget;
        lastThemeT.current = performance.now();
        state.setDirty();
      }
      const prog = Math.min(1, (performance.now() - lastThemeT.current) / 300);
      currentBg.current = prog < 1 ? lerp(currentBg.current, targetBg.current, prog) : targetBg.current;
      if (prog < 1) state.setDirty();

      if (state.dirty && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = currentBg.current;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw dotted grid
          const zoom = state.appState.zoom;
          let step = 20;
          let scaledStep = step * zoom;
          while (scaledStep < 15) {
            step *= 2;
            scaledStep = step * zoom;
          }

          const offsetX = state.appState.scrollX % scaledStep;
          const offsetY = state.appState.scrollY % scaledStep;
          const isDark = document.documentElement.classList.contains('dark');
          ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';

          ctx.beginPath();
          for (let x = offsetX - scaledStep; x < canvas.width + scaledStep; x += scaledStep) {
            for (let y = offsetY - scaledStep; y < canvas.height + scaledStep; y += scaledStep) {
              ctx.moveTo(x + 1, y);
              ctx.arc(x, y, 1, 0, Math.PI * 2);
            }
          }
          ctx.fill();

          ctx.save();
          ctx.translate(state.appState.scrollX, state.appState.scrollY);
          ctx.scale(state.appState.zoom, state.appState.zoom);
          const rc = rough.canvas(canvas);
          state.elements.forEach(el => renderElement(rc, ctx, el));
          if (state.appState.selectedElementIds.length > 0) {
            const sel = state.elements.filter(el => state.appState.selectedElementIds.includes(el.id) && !el.isDeleted);
            if (sel.length > 0) {
              let mnX = Infinity, mnY = Infinity, mxX = -Infinity, mxY = -Infinity;
              sel.forEach(el => {
                mnX = Math.min(mnX, el.x, el.x + el.width);
                mnY = Math.min(mnY, el.y, el.y + el.height);
                mxX = Math.max(mxX, el.x, el.x + el.width);
                mxY = Math.max(mxY, el.y, el.y + el.height);
              });
              const pad = 6 / state.appState.zoom;
              const hz = 8 / state.appState.zoom;

              ctx.strokeStyle = '#6965db';
              ctx.lineWidth = 1.5 / state.appState.zoom;
              ctx.setLineDash([]);
              ctx.strokeRect(mnX - pad, mnY - pad, mxX - mnX + pad * 2, mxY - mnY + pad * 2);

              const drawHandle = (hx: number, hy: number) => {
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#6965db';
                ctx.lineWidth = 1.5 / state.appState.zoom;
                ctx.fillRect(hx - hz / 2, hy - hz / 2, hz, hz);
                ctx.strokeRect(hx - hz / 2, hy - hz / 2, hz, hz);
              };
              const cx = (mnX + mxX) / 2, cy = (mnY + mxY) / 2;
              drawHandle(mnX - pad, mnY - pad); drawHandle(cx, mnY - pad); drawHandle(mxX + pad, mnY - pad);
              drawHandle(mxX + pad, cy);
              drawHandle(mxX + pad, mxY + pad); drawHandle(cx, mxY + pad); drawHandle(mnX - pad, mxY + pad);
              drawHandle(mnX - pad, cy);
            }
          }

          // marquee
          if (isMarquee.current) {
            const cur = screenToWorld(lastScreen.current.x, lastScreen.current.y, state.appState);
            const w = cur.x - startWorld.current.x, h = cur.y - startWorld.current.y;
            ctx.fillStyle = 'rgba(105,101,219,0.08)';
            ctx.strokeStyle = '#6965db';
            ctx.lineWidth = 1 / state.appState.zoom;
            ctx.setLineDash([4 / state.appState.zoom, 4 / state.appState.zoom]);
            ctx.fillRect(startWorld.current.x, startWorld.current.y, w, h);
            ctx.strokeRect(startWorld.current.x, startWorld.current.y, w, h);
            ctx.setLineDash([]);
          }

          ctx.restore();
          if (state.elements.filter(el => !el.isDeleted).length === 0) {
            ctx.fillStyle = 'rgba(140,140,140,0.6)';
            ctx.font = '25px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
              'Click and drag to sketch.',
              canvas.width / 2,
              canvas.height / 2
            );
          }
        }
        useElementsStore.setState({ dirty: false });
      }

      rafId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(rafId);
  }, []);

  // ── Resize ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) { canvasRef.current.width = window.innerWidth; canvasRef.current.height = window.innerHeight; useElementsStore.setState({ dirty: true }); }
      if (laserCanvasRef.current) { laserCanvasRef.current.width = window.innerWidth; laserCanvasRef.current.height = window.innerHeight; }
    };
    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Wheel ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      if (isDemo && !e.ctrlKey && !e.metaKey) {
        return; // Allow bare wheel to scroll the page in demo mode
      }
      e.preventDefault();
      const { appState, setAppState } = useElementsStore.getState();
      if (e.ctrlKey || e.metaKey) {
        let z = appState.zoom * (1 - e.deltaY * 0.001);
        z = Math.max(0.1, Math.min(z, 10));
        const ratio = z / appState.zoom;
        setAppState({ zoom: z, scrollX: e.clientX - (e.clientX - appState.scrollX) * ratio, scrollY: e.clientY - (e.clientY - appState.scrollY) * ratio });
      } else {
        setAppState({ scrollX: appState.scrollX - e.deltaX, scrollY: appState.scrollY - e.deltaY });
      }
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [isDemo]);

  // ── Keyboard ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isDemo && (!canvasRef.current || document.activeElement !== canvasRef.current)) return;
      if (editingTextIdRef.current) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.code === 'Space' && !isSpacePressed.current) {
        isSpacePressed.current = true;
        if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
        e.preventDefault();
      }

      if (readOnly || useElementsStore.getState().appState.isToolLocked) {
        const isModifierOnly = ['Control', 'Shift', 'Alt', 'Meta'].includes(e.key);
        if (!isModifierOnly && e.code !== 'Space') {
          useElementsStore.getState().addToast(readOnly ? 'This canvas is view-only.' : 'Canvas is locked. Unlock to edit.', 'error');
        }
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const state = useElementsStore.getState();
        if (state.appState.selectedElementIds.length > 0) {
          state.addHistoryPoint();
          state.appState.selectedElementIds.forEach(id => state.updateElement(id, { isDeleted: true }));
          state.setAppState({ selectedElementIds: [] });
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); useElementsStore.getState().undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); useElementsStore.getState().redo(); }
      if (e.key === 'Escape') useElementsStore.getState().setAppState({ selectedElementIds: [] });

      // Tool shortcuts (no modifiers)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const toolMap: Record<string, string> = {
          'Digit1': 'select', 'Digit2': 'rectangle', 'Digit3': 'diamond', 'Digit4': 'ellipse',
          'Digit5': 'arrow', 'Digit6': 'line', 'Digit7': 'freedraw', 'Digit8': 'text', 'Digit9': 'image', 'Digit0': 'eraser',
          'KeyH': 'hand', 'KeyV': 'select', 'KeyR': 'rectangle', 'KeyE': 'ellipse',
          'KeyA': 'arrow', 'KeyL': 'laser', 'KeyP': 'freedraw', 'KeyT': 'text',
        };
        const mapped = toolMap[e.code];
        if (mapped) useElementsStore.getState().setAppState({ activeTool: mapped as any });
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressed.current = false;
        if (canvasRef.current) canvasRef.current.style.cursor = '';
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [readOnly, isDemo]); // no editingTextId dep — use ref instead

  // ── Laser rAF ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let rafId: number;
    const renderLaser = () => {
      const lc = laserCanvasRef.current;
      if (lc) {
        const ctx = lc.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, lc.width, lc.height);
          if (laserLines.current.length > 0) {
            const now = performance.now();
            const { appState } = useElementsStore.getState();
            
            ctx.save();
            ctx.translate(appState.scrollX, appState.scrollY);
            ctx.scale(appState.zoom, appState.zoom);
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            const remainingLines = [];

            for (const line of laserLines.current) {
              let globalAlpha = 1;
              if (line.endTime !== null) {
                const elapsed = now - line.endTime;
                if (elapsed > 1000) {
                  continue; // fade out complete
                }
                globalAlpha = 1 - (elapsed / 1000);
              }
              remainingLines.push(line);

              if (line.points.length < 2) continue;

              ctx.globalAlpha = globalAlpha;
              ctx.beginPath();
              ctx.moveTo(line.points[0].x, line.points[0].y);
              for (let i = 1; i < line.points.length; i++) {
                ctx.lineTo(line.points[i].x, line.points[i].y);
              }
              ctx.strokeStyle = 'rgba(255, 50, 50, 0.7)';
              ctx.shadowBlur = 15 / appState.zoom;
              ctx.shadowColor = 'rgba(255, 50, 50, 1)';
              ctx.lineWidth = 6 / appState.zoom;
              ctx.stroke();
              ctx.shadowBlur = 0;
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2.5 / appState.zoom;
              ctx.stroke();
            }

            ctx.restore();
            laserLines.current = remainingLines;
          }
        }
      }
      rafId = requestAnimationFrame(renderLaser);
    };
    renderLaser();
    return () => cancelAnimationFrame(rafId);
  }, []);

  // ── Image import (must be synchronous with user gesture) ─────────────────────
  const importImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = () => {
      const file = input.files?.[0];
      document.body.removeChild(input);
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        if (!src) return;
        const img = new Image();
        img.onload = () => {
          imageCache[src] = img;
          const state = useElementsStore.getState();
          const { appState } = state;
          const cx = (window.innerWidth / 2 - appState.scrollX) / appState.zoom;
          const cy = (window.innerHeight / 2 - appState.scrollY) / appState.zoom;
          const maxW = Math.min(600, window.innerWidth * 0.5);
          const maxH = Math.min(400, window.innerHeight * 0.5);
          const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
          const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
          const el: Element = {
            id: nanoid(), type: 'image',
            x: cx - w / 2, y: cy - h / 2,
            width: w, height: h, angle: 0,
            strokeColor: 'transparent', backgroundColor: 'transparent',
            strokeWidth: 0, strokeStyle: 'solid', roughness: 0,
            opacity: 1, isDeleted: false,
            seed: Math.floor(Math.random() * 2 ** 31),
            fileId: src,
          };
              if (!state.appState.isToolLocked) {
                state.setAppState({ selectedElementIds: [el.id], activeTool: 'select' });
              } else {
                state.setAppState({ selectedElementIds: [el.id] });
              }
          state.addElement(el);
          state.addHistoryPoint();
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    };

    // Cancel cleans up the input
    input.addEventListener('cancel', () => {
      if (document.body.contains(input)) document.body.removeChild(input);
    });

    input.click();
  };

  // ── Global Paste Listener for Images ─────────────────────────────────────────
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (readOnly) {
        useElementsStore.getState().addToast('This canvas is view-only.', 'error');
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (!file) continue;
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = (ev) => {
            const src = ev.target?.result as string;
            if (!src) return;
            const img = new Image();
            img.onload = () => {
              imageCache[src] = img;
              const state = useElementsStore.getState();
              const { appState } = state;
              const cx = (window.innerWidth / 2 - appState.scrollX) / appState.zoom;
              const cy = (window.innerHeight / 2 - appState.scrollY) / appState.zoom;
              const maxW = Math.min(600, window.innerWidth * 0.5);
              const maxH = Math.min(400, window.innerHeight * 0.5);
              const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
              const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
              const el: Element = {
                id: nanoid(), type: 'image',
                x: cx - w / 2, y: cy - h / 2,
                width: w, height: h, angle: 0,
                strokeColor: 'transparent', backgroundColor: 'transparent',
                strokeWidth: 0, strokeStyle: 'solid', roughness: 0,
                opacity: 1, isDeleted: false,
                seed: Math.floor(Math.random() * 2 ** 31),
                fileId: src,
              };
                  if (!state.appState.isToolLocked) {
                state.setAppState({ selectedElementIds: [el.id], activeTool: 'select' });
              } else {
                state.setAppState({ selectedElementIds: [el.id] });
              }
              state.addElement(el);
              state.addHistoryPoint();
            };
            img.src = src;
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // ── Dynamic cursor from mouse position ───────────────────────────────────────
  const updateCursorForPosition = (clientX: number, clientY: number) => {
    const state = useElementsStore.getState();
    const { activeTool, selectedElementIds } = state.appState;

    if (isSpacePressed.current) { setCursor('grab'); return; }
    if (activeTool === 'hand') { setCursor('grab'); return; }
    if (activeTool === 'laser') { setCursor('crosshair'); return; }
    if (activeTool === 'eraser') { setCursor('cell'); return; }
    if (['rectangle', 'ellipse', 'diamond', 'arrow', 'line', 'text', 'freedraw', 'image'].includes(activeTool)) {
      setCursor('crosshair'); return;
    }

    if (activeTool === 'select') {
      const { x, y } = screenToWorld(clientX, clientY, state.appState);
      const selectedEls = state.elements.filter(el => selectedElementIds.includes(el.id) && !el.isDeleted);

      // hit-test handles before main elements to prioritize resize over move
      const handleHit = hitTestHandle(x, y, selectedEls, state.appState.zoom);
      if (handleHit) {
        setCursor(HANDLE_CURSORS[handleHit.handle] || 'pointer');
        return;
      }
      const hit = hitTest(x, y);
      if (hit && !hit.isDeleted) {
        setCursor('move');
        return;
      }

      setCursor('default');
    }
  };

  // ── Pointer Down ─────────────────────────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const state = useElementsStore.getState();
    activePointers.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });

    if (activePointers.current.size === 2) {
      // Cancel active single-touch actions
      isDrawing.current = false;
      isDraggingElems.current = false;
      isMarquee.current = false;
      dragHandle.current = null;
      drawingElementId.current = null;
      isPinching.current = true;
      
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
      pinchInitialDist.current = dist;
      pinchInitialZoom.current = state.appState.zoom;
      pinchInitialCenter.current = {
        x: (pts[0].clientX + pts[1].clientX) / 2,
        y: (pts[0].clientY + pts[1].clientY) / 2
      };
      e.currentTarget.setPointerCapture(e.pointerId);
      return; // Skip normal handling
    }

    if (isPinching.current) return; // Ignore additional touches while pinching

    if (state.appState.contextMenu) state.setAppState({ contextMenu: null });
    if (e.button === 2) return;

    const isMiddle = e.button === 1;
    if (readOnly || (state.appState.isToolLocked && state.appState.activeTool !== 'laser')) {
      if (!readOnly && state.appState.activeTool !== 'hand' && !isMiddle && !isSpacePressed.current) {
        state.addToast('Canvas is locked. Unlock to edit.', 'error');
      } else if (readOnly && state.appState.activeTool !== 'hand' && !isMiddle && !isSpacePressed.current) {
        state.addToast('This canvas is view-only.', 'error');
      }
      isPanning.current = true;
      lastScreen.current = { x: e.clientX, y: e.clientY };
      setCursor('grabbing');
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if (state.appState.activeTool === 'hand' || isMiddle || isSpacePressed.current) {
      isPanning.current = true;
      lastScreen.current = { x: e.clientX, y: e.clientY };
      setCursor('grabbing');
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    const { x, y } = screenToWorld(e.clientX, e.clientY, state.appState);
    startWorld.current = { x, y };
    lastScreen.current = { x: e.clientX, y: e.clientY };

    // ── Laser ──
    if (state.appState.activeTool === 'laser') {
      laserLines.current.push({ points: [{ x, y }], endTime: null });
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    // ── Eraser ──
    if (state.appState.activeTool === 'eraser') {
      isErasing.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      const hit = hitTest(x, y);
      if (hit) {
        state.addHistoryPoint();
        state.updateElement(hit.id, { isDeleted: true });
        state.setAppState({ selectedElementIds: [] });
      }
      return;
    }

    // ── Image ──
    if (state.appState.activeTool === 'image') {
      importImage();
      return;
    }

    // ── Text ──
    if (state.appState.activeTool === 'text') {
      const hit = hitTest(x, y);
      if (hit && hit.type === 'text' && !hit.isDeleted) {
        setEditingTextId(hit.id);
        return;
      }
      const el: Element = {
        id: nanoid(), type: 'text',
        x, y, width: 200, height: 28, angle: 0,
        strokeColor: state.appState.currentItemStyle.strokeColor === 'transparent' ? '#1e1e1e' : state.appState.currentItemStyle.strokeColor,
        backgroundColor: 'transparent',
        strokeWidth: 1, strokeStyle: 'solid',
        roughness: 0, opacity: 1, isDeleted: false,
        seed: Math.floor(Math.random() * 2 ** 31),
        text: '', 
        fontSize: state.appState.currentItemStyle.fontSize, 
        fontFamily: state.appState.currentItemStyle.fontFamily,
        textAlign: state.appState.currentItemStyle.textAlign,
      };
      state.addElement(el);
      if (!state.appState.isToolLocked) {
        state.setAppState({ selectedElementIds: [el.id], activeTool: 'select' });
      } else {
        state.setAppState({ selectedElementIds: [el.id] });
      } // defer editing state to ensure DOM syncs before focus
      setEditingTextId(el.id);
      return;
    }

    // ── Select ──
    if (state.appState.activeTool === 'select') {
      const selectedEls = state.elements.filter(el => state.appState.selectedElementIds.includes(el.id) && !el.isDeleted);
      const handleHit = hitTestHandle(x, y, selectedEls, state.appState.zoom);
      if (handleHit) {
        dragHandle.current = { elementId: handleHit.element.id, handle: handleHit.handle };
        origElems.current = Object.fromEntries(
          state.appState.selectedElementIds.map(id => {
            const el = state.elements.find(el => el.id === id);
            return el ? [id, { ...el }] : [id, null!];
          }).filter(([, v]) => v)
        );
        setCursor(HANDLE_CURSORS[handleHit.handle] || 'pointer');
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }
      const hit = hitTest(x, y);
      if (hit && !hit.isDeleted) {
        if (!state.appState.selectedElementIds.includes(hit.id)) {
          state.setAppState({ selectedElementIds: [hit.id] });
        }
        const allSelected = [...new Set([...state.appState.selectedElementIds, hit.id])];
        origElems.current = Object.fromEntries(
          allSelected.map(id => {
            const el = state.elements.find(el => el.id === id);
            return el ? [id, { ...el }] : [id, null!];
          }).filter(([, v]) => v)
        );
        isDraggingElems.current = true;
        setCursor('move');
      } else {
        state.setAppState({ selectedElementIds: [] });
        isMarquee.current = true;
      }
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    // ── Shape drawing tools ──
    if (['rectangle', 'ellipse', 'diamond', 'arrow', 'line'].includes(state.appState.activeTool)) {
      isDrawing.current = true;
      const el: Element = {
        id: nanoid(), type: state.appState.activeTool as ElementType,
        x, y, width: 0, height: 0, angle: 0,
        strokeColor: state.appState.currentItemStyle.strokeColor,
        backgroundColor: state.appState.currentItemStyle.backgroundColor,
        strokeWidth: state.appState.currentItemStyle.strokeWidth,
        strokeStyle: 'solid', roughness: state.appState.currentItemStyle.roughness,
        opacity: 1, isDeleted: false,
        seed: Math.floor(Math.random() * 2 ** 31),
      };
      drawingElementId.current = el.id;
      state.addElement(el);
      setCursor('crosshair');
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    // ── Freedraw ──
    if (state.appState.activeTool === 'freedraw') {
      isDrawing.current = true;
      const el: Element = {
        id: nanoid(), type: 'freedraw',
        x, y, width: 0, height: 0, angle: 0,
        strokeColor: state.appState.currentItemStyle.strokeColor,
        backgroundColor: 'transparent',
        strokeWidth: Math.max(state.appState.currentItemStyle.strokeWidth, 2),
        strokeStyle: 'solid', roughness: 0,
        opacity: 1, isDeleted: false,
        seed: Math.floor(Math.random() * 2 ** 31),
        points: [{ x: 0, y: 0 }],
      };
      drawingElementId.current = el.id;
      state.addElement(el);
      setCursor('crosshair');
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
  };

  // ── Pointer Move ─────────────────────────────────────────────────────────────
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
    }

    const state = useElementsStore.getState();

    if (isPinching.current && activePointers.current.size === 2) {
      const pts = Array.from(activePointers.current.values());
      const newDist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
      const newCenter = {
        x: (pts[0].clientX + pts[1].clientX) / 2,
        y: (pts[0].clientY + pts[1].clientY) / 2
      };

      // Handle Pan
      const dx = newCenter.x - pinchInitialCenter.current.x;
      const dy = newCenter.y - pinchInitialCenter.current.y;
      
      // Handle Zoom
      const scale = newDist / pinchInitialDist.current;
      let newZoom = pinchInitialZoom.current * scale;
      newZoom = Math.max(0.1, Math.min(newZoom, 5));

      // Calculate new scroll positions to zoom into the pinch center
      // Similar to wheel zoom logic
      const zoomCenterWorldX = (newCenter.x - state.appState.scrollX - dx) / pinchInitialZoom.current;
      const zoomCenterWorldY = (newCenter.y - state.appState.scrollY - dy) / pinchInitialZoom.current;
      
      const newScrollX = newCenter.x - (zoomCenterWorldX * newZoom);
      const newScrollY = newCenter.y - (zoomCenterWorldY * newZoom);

      state.setAppState({
        zoom: newZoom,
        scrollX: newScrollX,
        scrollY: newScrollY
      });
      return;
    }

    if (isPinching.current) return;

    if (isPanning.current) {
      const dx = e.clientX - lastScreen.current.x;
      const dy = e.clientY - lastScreen.current.y;
      state.setAppState({ scrollX: state.appState.scrollX + dx, scrollY: state.appState.scrollY + dy });
      lastScreen.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const { x, y } = screenToWorld(e.clientX, e.clientY, state.appState);

    if (state.appState.activeTool === 'laser' && e.buttons === 1) {
      const activeLine = laserLines.current.find(l => l.endTime === null);
      if (activeLine) {
        activeLine.points.push({ x, y });
      }
      return;
    }

    if (isErasing.current && e.buttons === 1) {
      const hit = hitTest(x, y);
      if (hit) {
        state.updateElement(hit.id, { isDeleted: true });
        state.setAppState({ selectedElementIds: state.appState.selectedElementIds.filter(id => id !== hit.id) });
      }
      return;
    }

    if (dragHandle.current && e.buttons === 1) {
      const orig = origElems.current[dragHandle.current.elementId];
      if (orig) {
        const { handle } = dragHandle.current;
        let mnX = Math.min(orig.x, orig.x + orig.width);
        let mxX = Math.max(orig.x, orig.x + orig.width);
        let mnY = Math.min(orig.y, orig.y + orig.height);
        let mxY = Math.max(orig.y, orig.y + orig.height);
        if (handle.includes('w')) mnX = x;
        if (handle.includes('e')) mxX = x;
        if (handle.includes('n')) mnY = y;
        if (handle.includes('s')) mxY = y;
        state.updateElement(orig.id, { x: mnX, y: mnY, width: mxX - mnX, height: mxY - mnY });
      }
      return;
    }

    if (isDraggingElems.current && e.buttons === 1) {
      const dx = x - startWorld.current.x;
      const dy = y - startWorld.current.y;
      state.appState.selectedElementIds.forEach(id => {
        const orig = origElems.current[id];
        if (orig) state.updateElement(id, { x: orig.x + dx, y: orig.y + dy });
      });
      return;
    }

    if (isMarquee.current) {
      lastScreen.current = { x: e.clientX, y: e.clientY };
      const mnX = Math.min(startWorld.current.x, x), mxX = Math.max(startWorld.current.x, x);
      const mnY = Math.min(startWorld.current.y, y), mxY = Math.max(startWorld.current.y, y);
      const selected = state.elements.filter(el => {
        if (el.isDeleted) return false;
        const elMnX = Math.min(el.x, el.x + el.width), elMxX = Math.max(el.x, el.x + el.width);
        const elMnY = Math.min(el.y, el.y + el.height), elMxY = Math.max(el.y, el.y + el.height);
        return elMnX <= mxX && elMxX >= mnX && elMnY <= mxY && elMxY >= mnY;
      });
      state.setAppState({ selectedElementIds: selected.map(el => el.id) });
      return;
    }

    if (isDrawing.current && drawingElementId.current) {
      const el = state.elements.find(el => el.id === drawingElementId.current);
      if (!el) return;
      if (el.type === 'freedraw') {
        const pts = [...(el.points || []), { x: x - el.x, y: y - el.y }];
        let minX = 0, minY = 0, maxX = 0, maxY = 0;
        pts.forEach(p => {
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        });
        const shiftedPts = pts.map(p => ({ x: p.x - minX, y: p.y - minY }));
        state.updateElement(el.id, { 
          x: el.x + minX, 
          y: el.y + minY, 
          width: maxX - minX, 
          height: maxY - minY, 
          points: shiftedPts 
        });
      } else {
        state.updateElement(el.id, { width: x - startWorld.current.x, height: y - startWorld.current.y });
      }
      return;
    }

    // No drag active — update hover cursor
    updateCursorForPosition(e.clientX, e.clientY);
  };

  // ── Pointer Up ───────────────────────────────────────────────────────────────
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointers.current.delete(e.pointerId);
    
    if (activePointers.current.size === 0) {
      isPinching.current = false;
    }

    if (isPinching.current) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      return; // Ignore individual pointer releases until all are up
    }

    const state = useElementsStore.getState();

    if (isPanning.current) {
      isPanning.current = false;
      setCursor('grab');
      e.currentTarget.releasePointerCapture(e.pointerId);
      updateCursorForPosition(e.clientX, e.clientY);
      return;
    }
    if (state.appState.activeTool === 'laser') {
      const activeLine = laserLines.current.find(l => l.endTime === null);
      if (activeLine) {
        activeLine.endTime = performance.now();
      }
      e.currentTarget.releasePointerCapture(e.pointerId);
      return;
    }
    if (isErasing.current) {
      isErasing.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
      return;
    }
    if (dragHandle.current) {
      dragHandle.current = null;
      origElems.current = {};
      state.addHistoryPoint();
      e.currentTarget.releasePointerCapture(e.pointerId);
      updateCursorForPosition(e.clientX, e.clientY);
      return;
    }
    if (isDraggingElems.current) {
      isDraggingElems.current = false;
      origElems.current = {};
      state.addHistoryPoint();
      e.currentTarget.releasePointerCapture(e.pointerId);
      updateCursorForPosition(e.clientX, e.clientY);
      return;
    }
    if (isMarquee.current) {
      isMarquee.current = false;
      state.setDirty();
      e.currentTarget.releasePointerCapture(e.pointerId);
      return;
    }
    if (isDrawing.current) {
      isDrawing.current = false;
      const el = state.elements.find(el => el.id === drawingElementId.current);
      if (el) {
        if (el.type !== 'freedraw' && Math.abs(el.width) < 2 && Math.abs(el.height) < 2) {
          state.updateElement(el.id, { isDeleted: true });
          if (!state.appState.isToolLocked) {
            state.setAppState({ activeTool: 'select' });
          }
        } else {
          if (!state.appState.isToolLocked) {
            state.setAppState({ selectedElementIds: [el.id], activeTool: 'select' });
          } else {
            state.setAppState({ selectedElementIds: [el.id] });
          }
          state.addHistoryPoint();
        }
      }
      drawingElementId.current = null;
      e.currentTarget.releasePointerCapture(e.pointerId);
      return;
    }
  };

  // ── Double Click ─────────────────────────────────────────────────────────────
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const state = useElementsStore.getState();
    if (state.appState.isToolLocked) {
      state.addToast('Canvas is locked. Unlock to edit.', 'error');
      return;
    }
    const { x, y } = screenToWorld(e.clientX, e.clientY, state.appState);
    const hit = hitTest(x, y);
    if (hit && hit.type === 'text' && !hit.isDeleted) {
      setEditingTextId(hit.id);
    } else if (!hit) {
      const el: Element = {
        id: nanoid(), type: 'text',
        x, y, width: 200, height: 28, angle: 0,
        strokeColor: state.appState.currentItemStyle.strokeColor === 'transparent' ? '#1e1e1e' : state.appState.currentItemStyle.strokeColor,
        backgroundColor: 'transparent',
        strokeWidth: 1, strokeStyle: 'solid',
        roughness: 0, opacity: 1, isDeleted: false,
        seed: Math.floor(Math.random() * 2 ** 31),
        text: '', 
        fontSize: state.appState.currentItemStyle.fontSize, 
        fontFamily: state.appState.currentItemStyle.fontFamily,
        textAlign: state.appState.currentItemStyle.textAlign,
      };
      state.addElement(el);
      if (!state.appState.isToolLocked) {
        state.setAppState({ activeTool: 'select', selectedElementIds: [el.id] });
      } else {
        state.setAppState({ selectedElementIds: [el.id] });
      }
      setEditingTextId(el.id);
    }
  };

  // ── Context Menu ─────────────────────────────────────────────────────────────
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const state = useElementsStore.getState();
    const { x, y } = screenToWorld(e.clientX, e.clientY, state.appState);
    const hit = hitTest(x, y);
    if (hit && !hit.isDeleted) {
      if (!state.appState.selectedElementIds.includes(hit.id)) state.setAppState({ selectedElementIds: [hit.id] });
      state.setAppState({ contextMenu: { x: e.clientX, y: e.clientY, type: 'element' } });
    } else {
      state.setAppState({ contextMenu: { x: e.clientX, y: e.clientY, type: 'canvas' } });
    }
  };

  const editingElement = useElementsStore(s => s.elements.find(el => el.id === editingTextId && !el.isDeleted));
  const appState = useElementsStore(s => s.appState);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 select-none overflow-hidden touch-none"
    >
      <canvas
        ref={canvasRef}
        tabIndex={isDemo ? 0 : -1}
        className="block touch-none outline-none"
        onPointerDown={(e) => {
          if (isDemo && canvasRef.current) {
            canvasRef.current.focus();
          }
          handlePointerDown(e);
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        style={{ display: 'block', position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none' }}
      />
      <canvas
        ref={laserCanvasRef}
        className="pointer-events-none"
        style={{ position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%', zIndex: 10 }}
      />
      {editingElement && (
        <TextEditorOverlay
          element={editingElement}
          appState={appState}
          onCommit={(val) => {
            const state = useElementsStore.getState();
            if (!val.trim()) {
              state.updateElement(editingElement.id, { isDeleted: true });
            } else {
              const text = val.trim();
              const lines = text.split('\n');
              const fontSize = editingElement.fontSize || 20;
              const fontFamily = editingElement.fontFamily || 'sans-serif';
              const fontWeight = editingElement.strokeWidth === 4 ? 800 : editingElement.strokeWidth === 2 ? 500 : 300;
              
              const ctx = canvasRef.current!.getContext('2d')!;
              ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
              
              let maxWidth = 0;
              for (const line of lines) {
                const w = ctx.measureText(line).width;
                if (w > maxWidth) maxWidth = w;
              }
              
              const w = maxWidth;
              const h = lines.length * fontSize * 1.25;
              
              state.updateElement(editingElement.id, { text, width: w, height: h });
              state.addHistoryPoint();
            }
            setEditingTextId((prev) => prev === editingElement.id ? null : prev);
          }}
        />
      )}
    </div>
  );
};
