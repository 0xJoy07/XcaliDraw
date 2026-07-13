import React, { useEffect, useRef } from 'react';
import { useElementsStore } from '../store/elementsStore';
import type { AppState } from '../store/elementsStore';
import { nanoid } from 'nanoid';
import type { Element, ElementType } from '../types/element';
import rough from 'roughjs';
import { renderElement, setDirtyCallback } from './renderElement';
import { screenToWorld, worldToScreen } from '../lib/coords';
import { hitTest, hitTestHandle } from './hitTest';

// Register dirty callback so async image loads trigger re-renders
setDirtyCallback(() => useElementsStore.getState().setDirty());

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

  // auto-focus on mount
  React.useEffect(() => { taRef.current?.focus(); }, []);

  // auto-resize
  React.useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
    ta.style.width = 'auto';
    ta.style.width = `${Math.max(ta.scrollWidth, 120)}px`;
  }, [draft]);

  const pos = worldToScreen(element.x, element.y, appState);
  const fontSize = (element.fontSize || 20) * appState.zoom;

  const commit = () => onCommit(draft);

  return (
    <textarea
      ref={taRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Escape') { e.currentTarget.blur(); }
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); }
      }}
      style={{
        position: 'absolute',
        zIndex: 300,
        left: pos.x,
        top: pos.y,
        fontSize,
        lineHeight: 1.25,
        fontFamily: element.fontFamily || 'sans-serif',
        color: element.strokeColor === 'transparent' ? '#1e1e1e' : (element.strokeColor || '#1e1e1e'),
        background: 'transparent',
        border: '1.5px dashed #6965db',
        borderRadius: 3,
        outline: 'none',
        resize: 'none',
        overflow: 'hidden',
        padding: '2px 4px',
        margin: 0,
        minWidth: Math.max(120, 120 * appState.zoom),
        minHeight: fontSize * 1.4,
        boxShadow: '0 0 0 2px rgba(105,101,219,0.2)',
      }}
    />
  );
};

// ─── Canvas Component ─────────────────────────────────────────────────────────
export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const laserCanvasRef = useRef<HTMLCanvasElement>(null);

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
  const [editingTextId, setEditingTextId] = React.useState<string | null>(null);

  // drag / resize refs
  const isDraggingElems = useRef(false);
  const dragHandle = useRef<{ elementId: string; handle: string } | null>(null);
  const origElems = useRef<Record<string, Element>>({});

  // laser
  const laserPoints = useRef<{ x: number; y: number; t: number }[]>([]);

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

      // theme lerp
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
          // clear
          ctx.fillStyle = currentBg.current;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.save();
          ctx.translate(state.appState.scrollX, state.appState.scrollY);
          ctx.scale(state.appState.zoom, state.appState.zoom);

          // render all elements
          const rc = rough.canvas(canvas);
          state.elements.forEach(el => renderElement(rc, ctx, el));

          // selection box + handles
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

          // marquee selection rect
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

          // empty canvas hint
          if (state.elements.filter(el => !el.isDeleted).length === 0) {
            ctx.restore();
            ctx.save();
            ctx.fillStyle = 'rgba(150,150,150,0.6)';
            ctx.font = '15px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
              'Double-click or press T to add text · Right-click for more options',
              canvas.width / 2,
              canvas.height / 2
            );
          }

          ctx.restore();
        }
        useElementsStore.setState({ dirty: false });
      }

      rafId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(rafId);
  }, []);

  // ── Resize observer ──────────────────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) { canvasRef.current.width = window.innerWidth; canvasRef.current.height = window.innerHeight; useElementsStore.setState({ dirty: true }); }
      if (laserCanvasRef.current) { laserCanvasRef.current.width = window.innerWidth; laserCanvasRef.current.height = window.innerHeight; }
    };
    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Wheel zoom / scroll ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
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
  }, []);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when editing text
      if (editingTextId) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Space → pan
      if (e.code === 'Space' && !isSpacePressed.current) {
        isSpacePressed.current = true;
        if (canvasRef.current && useElementsStore.getState().appState.activeTool !== 'hand') {
          canvasRef.current.style.cursor = 'grab';
        }
      }

      // Delete / Backspace → remove selected elements
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const state = useElementsStore.getState();
        if (state.appState.selectedElementIds.length > 0) {
          state.addHistoryPoint();
          state.appState.selectedElementIds.forEach(id => state.updateElement(id, { isDeleted: true }));
          state.setAppState({ selectedElementIds: [] });
        }
      }

      // Ctrl+Z undo, Ctrl+Y redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); useElementsStore.getState().undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); useElementsStore.getState().redo(); }

      // Escape → deselect
      if (e.key === 'Escape') useElementsStore.getState().setAppState({ selectedElementIds: [] });

      // Tool shortcuts
      const toolMap: Record<string, string> = { '1': 'select', '2': 'rectangle', '3': 'diamond', '4': 'ellipse', '5': 'arrow', '6': 'line', '7': 'freedraw', '8': 'text', '0': 'eraser', 'h': 'hand', 'v': 'select', 'r': 'rectangle', 'e': 'ellipse', 'a': 'arrow', 'l': 'laser', 'p': 'freedraw', 't': 'text' };
      const mapped = toolMap[e.key.toLowerCase()];
      if (mapped && !e.ctrlKey && !e.metaKey) useElementsStore.getState().setAppState({ activeTool: mapped as any });
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
  }, [editingTextId]);

  // ── Laser rAF loop ───────────────────────────────────────────────────────────
  useEffect(() => {
    let rafId: number;
    const render = () => {
      const lc = laserCanvasRef.current;
      if (lc) {
        const ctx = lc.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, lc.width, lc.height);
          const now = performance.now();
          laserPoints.current = laserPoints.current.filter(p => now - p.t < 900);

          if (laserPoints.current.length > 1) {
            const { appState } = useElementsStore.getState();
            ctx.save();
            ctx.translate(appState.scrollX, appState.scrollY);
            ctx.scale(appState.zoom, appState.zoom);
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.lineWidth = 3 / appState.zoom;

            for (let i = 1; i < laserPoints.current.length; i++) {
              const p1 = laserPoints.current[i - 1];
              const p2 = laserPoints.current[i];
              const opacity = Math.max(0, 1 - (now - p2.t) / 900);
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(255,50,50,${opacity})`;
              ctx.shadowBlur = 6 / appState.zoom;
              ctx.shadowColor = `rgba(255,100,100,${opacity * 0.8})`;
              ctx.stroke();
            }
            ctx.restore();
          }
        }
      }
      rafId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(rafId);
  }, []);

  // ── Image import ─────────────────────────────────────────────────────────────
  const importImage = React.useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const state = useElementsStore.getState();
          const { appState } = state;
          // Place image at center of viewport
          const cx = (window.innerWidth / 2 - appState.scrollX) / appState.zoom;
          const cy = (window.innerHeight / 2 - appState.scrollY) / appState.zoom;
          const maxW = 400, maxH = 300;
          const scale = Math.min(maxW / img.width, maxH / img.height, 1);
          const w = img.width * scale, h = img.height * scale;
          const el: Element = {
            id: nanoid(), type: 'image',
            x: cx - w / 2, y: cy - h / 2,
            width: w, height: h,
            angle: 0,
            strokeColor: 'transparent', backgroundColor: 'transparent',
            strokeWidth: 0, strokeStyle: 'solid', roughness: 0,
            opacity: 1, isDeleted: false,
            seed: Math.floor(Math.random() * 2 ** 31),
            fileId: src,
          };
          state.addElement(el);
          state.setAppState({ selectedElementIds: [el.id] });
          state.addHistoryPoint();
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, []);

  // ── Pointer Down ─────────────────────────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const state = useElementsStore.getState();

    if (state.appState.contextMenu) state.setAppState({ contextMenu: null });

    // Right-click — handled by onContextMenu
    if (e.button === 2) return;

    const isMiddle = e.button === 1;
    if (state.appState.activeTool === 'hand' || isMiddle || isSpacePressed.current) {
      isPanning.current = true;
      lastScreen.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    const { x, y } = screenToWorld(e.clientX, e.clientY, state.appState);
    startWorld.current = { x, y };
    lastScreen.current = { x: e.clientX, y: e.clientY };

    // ── Laser ──
    if (state.appState.activeTool === 'laser') {
      laserPoints.current.push({ x, y, t: performance.now() });
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    // ── Eraser ──
    if (state.appState.activeTool === 'eraser') {
      isErasing.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      // erase element under cursor immediately
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
      // If clicked on an existing text element, edit it
      const hit = hitTest(x, y);
      if (hit && hit.type === 'text') {
        setEditingTextId(hit.id);
        return;
      }
      // Otherwise create a new text element
      const el: Element = {
        id: nanoid(), type: 'text',
        x, y, width: 200, height: 28,
        angle: 0,
        strokeColor: state.appState.currentItemStyle.strokeColor,
        backgroundColor: 'transparent',
        strokeWidth: 1, strokeStyle: 'solid',
        roughness: 0, opacity: 1, isDeleted: false,
        seed: Math.floor(Math.random() * 2 ** 31),
        text: '', fontSize: 20, fontFamily: 'sans-serif',
      };
      state.addElement(el);
      // Switch to select and begin editing — do NOT switch tool yet to avoid re-render race
      state.setAppState({ activeTool: 'select', selectedElementIds: [el.id] });
      setEditingTextId(el.id);
      return;
    }

    // ── Select ──
    if (state.appState.activeTool === 'select') {
      const selectedEls = state.elements.filter(el => state.appState.selectedElementIds.includes(el.id) && !el.isDeleted);
      // Handle check first
      const handleHit = hitTestHandle(x, y, selectedEls, state.appState.zoom);
      if (handleHit) {
        dragHandle.current = { elementId: handleHit.element.id, handle: handleHit.handle };
        origElems.current = Object.fromEntries(
          state.appState.selectedElementIds.map(id => {
            const el = state.elements.find(el => el.id === id)!;
            return [id, { ...el }];
          })
        );
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }
      // Element hit
      const hit = hitTest(x, y);
      if (hit && !hit.isDeleted) {
        if (!state.appState.selectedElementIds.includes(hit.id)) {
          state.setAppState({ selectedElementIds: [hit.id] });
        }
        origElems.current = Object.fromEntries(
          [...state.appState.selectedElementIds, hit.id].filter((v, i, a) => a.indexOf(v) === i).map(id => {
            const el = state.elements.find(el => el.id === id)!;
            return [id, { ...el }];
          })
        );
        isDraggingElems.current = true;
      } else {
        state.setAppState({ selectedElementIds: [] });
        isMarquee.current = true;
      }
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    // ── Drawing tools ──
    if (['rectangle', 'ellipse', 'diamond', 'arrow', 'line'].includes(state.appState.activeTool)) {
      isDrawing.current = true;
      const el: Element = {
        id: nanoid(), type: state.appState.activeTool as ElementType,
        x, y, width: 0, height: 0, angle: 0,
        strokeColor: state.appState.currentItemStyle.strokeColor,
        backgroundColor: state.appState.currentItemStyle.backgroundColor,
        strokeWidth: state.appState.currentItemStyle.strokeWidth,
        strokeStyle: 'solid',
        roughness: state.appState.currentItemStyle.roughness,
        opacity: 1, isDeleted: false,
        seed: Math.floor(Math.random() * 2 ** 31),
      };
      drawingElementId.current = el.id;
      state.addElement(el);
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
        strokeWidth: state.appState.currentItemStyle.strokeWidth,
        strokeStyle: 'solid',
        roughness: 0, opacity: 1, isDeleted: false,
        seed: Math.floor(Math.random() * 2 ** 31),
        points: [{ x: 0, y: 0 }],
      };
      drawingElementId.current = el.id;
      state.addElement(el);
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
  };

  // ── Pointer Move ──────────────────────────────────────────────────────────────
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // ── Pan ──
    if (isPanning.current) {
      const dx = e.clientX - lastScreen.current.x;
      const dy = e.clientY - lastScreen.current.y;
      const state = useElementsStore.getState();
      state.setAppState({ scrollX: state.appState.scrollX + dx, scrollY: state.appState.scrollY + dy });
      lastScreen.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const state = useElementsStore.getState();
    const { x, y } = screenToWorld(e.clientX, e.clientY, state.appState);

    // ── Laser ──
    if (state.appState.activeTool === 'laser' && e.buttons === 1) {
      laserPoints.current.push({ x, y, t: performance.now() });
      return;
    }

    // ── Eraser ──
    if (isErasing.current && e.buttons === 1) {
      const hit = hitTest(x, y);
      if (hit) {
        state.updateElement(hit.id, { isDeleted: true });
        state.setAppState({ selectedElementIds: state.appState.selectedElementIds.filter(id => id !== hit.id) });
      }
      return;
    }

    // ── Handle resize ──
    if (dragHandle.current) {
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

    // ── Move elements ──
    if (isDraggingElems.current && e.buttons === 1) {
      const dx = x - startWorld.current.x;
      const dy = y - startWorld.current.y;
      state.appState.selectedElementIds.forEach(id => {
        const orig = origElems.current[id];
        if (orig) state.updateElement(id, { x: orig.x + dx, y: orig.y + dy });
      });
      return;
    }

    // ── Marquee ──
    if (isMarquee.current) {
      lastScreen.current = { x: e.clientX, y: e.clientY };
      const mnX = Math.min(startWorld.current.x, x);
      const mxX = Math.max(startWorld.current.x, x);
      const mnY = Math.min(startWorld.current.y, y);
      const mxY = Math.max(startWorld.current.y, y);
      const selected = state.elements.filter(el => {
        if (el.isDeleted) return false;
        const elMnX = Math.min(el.x, el.x + el.width), elMxX = Math.max(el.x, el.x + el.width);
        const elMnY = Math.min(el.y, el.y + el.height), elMxY = Math.max(el.y, el.y + el.height);
        return elMnX <= mxX && elMxX >= mnX && elMnY <= mxY && elMxY >= mnY;
      });
      state.setAppState({ selectedElementIds: selected.map(el => el.id) });
      return;
    }

    // ── Drawing shapes ──
    if (isDrawing.current && drawingElementId.current) {
      const el = state.elements.find(el => el.id === drawingElementId.current);
      if (!el) return;

      if (el.type === 'freedraw') {
        const pts = [...(el.points || []), { x: x - el.x, y: y - el.y }];
        state.updateElement(el.id, { points: pts });
      } else {
        state.updateElement(el.id, { width: x - startWorld.current.x, height: y - startWorld.current.y });
      }
    }
  };

  // ── Pointer Up ───────────────────────────────────────────────────────────────
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const state = useElementsStore.getState();

    if (isPanning.current) {
      isPanning.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
      return;
    }

    if (state.appState.activeTool === 'laser') {
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
      return;
    }

    if (isDraggingElems.current) {
      isDraggingElems.current = false;
      origElems.current = {};
      state.addHistoryPoint();
      e.currentTarget.releasePointerCapture(e.pointerId);
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
        } else {
          state.setAppState({ selectedElementIds: [el.id], activeTool: 'select' });
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
    const { x, y } = screenToWorld(e.clientX, e.clientY, state.appState);
    const hit = hitTest(x, y);
    if (hit && hit.type === 'text') {
      setEditingTextId(hit.id);
    } else if (!hit) {
      // double-click on empty canvas → create text
      const el: Element = {
        id: nanoid(), type: 'text',
        x, y, width: 200, height: 28,
        angle: 0,
        strokeColor: state.appState.currentItemStyle.strokeColor,
        backgroundColor: 'transparent',
        strokeWidth: 1, strokeStyle: 'solid',
        roughness: 0, opacity: 1, isDeleted: false,
        seed: Math.floor(Math.random() * 2 ** 31),
        text: '', fontSize: 20, fontFamily: 'sans-serif',
      };
      state.addElement(el);
      state.setAppState({ activeTool: 'select', selectedElementIds: [el.id] });
      setEditingTextId(el.id);
    }
  };

  // ── Context Menu ──────────────────────────────────────────────────────────────
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
  const activeTool = appState.activeTool;

  const cursor = activeTool === 'hand' ? 'grab'
    : ['rectangle', 'ellipse', 'diamond', 'arrow', 'line', 'text', 'freedraw'].includes(activeTool) ? 'crosshair'
    : activeTool === 'eraser' ? 'cell'
    : activeTool === 'laser' ? 'none'
    : 'default';

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        style={{ display: 'block', position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', cursor }}
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
              state.updateElement(editingElement.id, { text: val.trim(), width: 200, height: 28 });
              state.addHistoryPoint();
            }
            setEditingTextId(null);
          }}
        />
      )}
    </div>
  );
};
