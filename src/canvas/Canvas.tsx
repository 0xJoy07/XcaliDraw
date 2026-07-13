import React, { useEffect, useRef } from 'react';
import { useElementsStore } from '../store/elementsStore';
import type { AppState } from '../store/elementsStore';
import { nanoid } from 'nanoid';
import type { Element, ElementType } from '../types/element';
import rough from 'roughjs';
import { renderElement } from './renderElement';
import { screenToWorld, worldToScreen } from '../lib/coords';
import { hitTest, hitTestHandle } from './hitTest';

const TextEditorOverlay = ({ element, appState, onCommit }: { element: Element, appState: AppState, onCommit: (text: string | null) => void }) => {
  const [draft, setDraft] = React.useState(element.text || '');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as user types
  React.useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${ta.scrollHeight}px`;
      ta.style.width = 'auto';
      ta.style.width = `${Math.max(ta.scrollWidth, 100 * appState.zoom)}px`;
    }
  }, [draft, appState.zoom]);

  const screenPos = worldToScreen(element.x, element.y, appState);
  
  return (
    <textarea
      ref={textareaRef}
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onCommit(draft)}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          e.currentTarget.blur();
        }
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      style={{
        position: 'absolute',
        zIndex: 200,
        left: screenPos.x,
        top: screenPos.y,
        font: `${(element.fontSize || 20) * appState.zoom}px/${1.25} ${element.fontFamily || 'Virgil, Comic Sans MS, cursive, sans-serif'}`,
        color: element.strokeColor === 'transparent' ? '#1e1e1e' : element.strokeColor,
        background: 'rgba(255,255,255,0.01)',
        border: '1.5px dashed #6965db',
        borderRadius: 2,
        boxShadow: '0 0 0 2px rgba(105,101,219,0.15)',
        outline: 'none',
        resize: 'none',
        overflow: 'hidden',
        margin: 0,
        padding: '2px 4px',
        lineHeight: 1.25,
        minWidth: Math.max(100 * appState.zoom, 80),
        minHeight: (element.fontSize || 20) * 1.25 * appState.zoom + 8,
      }}
    />
  );
};

export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPanning = useRef(false);
  const isDrawing = useRef(false);
  const isMarquee = useRef(false);
  const drawingElementId = useRef<string | null>(null);
  const startMousePos = useRef({ x: 0, y: 0 }); // World coords
  const lastMousePos = useRef({ x: 0, y: 0 }); // Screen coords
  const isSpacePressed = useRef(false);
  const [editingTextElementId, setEditingTextElementId] = React.useState<string | null>(null);
  
  const laserCanvasRef = useRef<HTMLCanvasElement>(null);
  const laserPoints = useRef<{ x: number, y: number, timestamp: number }[]>([]);

  const isDraggingElements = useRef(false);
  const draggingHandle = useRef<{ elementId: string, handle: string } | null>(null);
  const originalElementsForDrag = useRef<Record<string, Element>>({});

  const currentCanvasBg = useRef('#f8f9fa');
  const targetCanvasBg = useRef('#f8f9fa');
  const lastThemeTime = useRef(performance.now());

  useEffect(() => {
    let animationFrameId: number;
    
    // Parse any CSS color string (hex or rgb(...)) into {r,g,b}
    const parseColor = (color: string): { r: number, g: number, b: number } => {
      // Try hex first
      const hexResult = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color.trim());
      if (hexResult) {
        return {
          r: parseInt(hexResult[1], 16),
          g: parseInt(hexResult[2], 16),
          b: parseInt(hexResult[3], 16)
        };
      }
      // Try rgb(r, g, b)
      const rgbResult = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i.exec(color.trim());
      if (rgbResult) {
        return { r: parseInt(rgbResult[1]), g: parseInt(rgbResult[2]), b: parseInt(rgbResult[3]) };
      }
      // Fallback to light canvas color
      return { r: 248, g: 249, b: 250 };
    };

    const lerpColor = (a: string, b: string, amount: number) => {
      const rgbA = parseColor(a);
      const rgbB = parseColor(b);
      const r = Math.round(rgbA.r + (rgbB.r - rgbA.r) * amount);
      const g = Math.round(rgbA.g + (rgbB.g - rgbA.g) * amount);
      const b2 = Math.round(rgbA.b + (rgbB.b - rgbA.b) * amount);
      return `rgb(${r}, ${g}, ${b2})`;
    };
    
    const render = () => {
      const state = useElementsStore.getState();
      
      const newTarget = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg').trim() || '#f8f9fa';
      if (newTarget !== targetCanvasBg.current) {
        targetCanvasBg.current = newTarget;
        lastThemeTime.current = performance.now();
        state.setDirty();
      }

      const now = performance.now();
      const progress = Math.min(1, (now - lastThemeTime.current) / 200);
      currentCanvasBg.current = progress < 1 
        ? lerpColor(currentCanvasBg.current, targetCanvasBg.current, progress)
        : targetCanvasBg.current;

      if (progress < 1) {
        state.setDirty(); // Keep rendering during transition
      }

      if (state.dirty && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.fillStyle = currentCanvasBg.current;
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          ctx.save();
          ctx.translate(state.appState.scrollX, state.appState.scrollY);
          ctx.scale(state.appState.zoom, state.appState.zoom);
          
          const rc = rough.canvas(canvasRef.current);
          state.elements.forEach(el => renderElement(rc, ctx, el));

          // Draw selection box and handles
          if (state.appState.selectedElementIds.length > 0) {
            ctx.strokeStyle = '#6965db';
            ctx.lineWidth = 1 / state.appState.zoom;
            ctx.setLineDash([]);
            
            const selectedElements = state.elements.filter(el => state.appState.selectedElementIds.includes(el.id));
            if (selectedElements.length > 0) {
              let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
              selectedElements.forEach(el => {
                minX = Math.min(minX, el.x, el.x + el.width);
                minY = Math.min(minY, el.y, el.y + el.height);
                maxX = Math.max(maxX, el.x, el.x + el.width);
                maxY = Math.max(maxY, el.y, el.y + el.height);
              });
              
              const pad = 4 / state.appState.zoom;
              ctx.strokeRect(minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2);
              
              // Draw 8 handles (simplified for single selection or bounds)
              const handleSize = 8 / state.appState.zoom;
              const hHalf = handleSize / 2;
              const drawHandle = (hx: number, hy: number) => {
                ctx.fillStyle = '#fff';
                ctx.fillRect(hx - hHalf, hy - hHalf, handleSize, handleSize);
                ctx.strokeRect(hx - hHalf, hy - hHalf, handleSize, handleSize);
              };
              
              drawHandle(minX - pad, minY - pad);
              drawHandle(minX + (maxX - minX) / 2, minY - pad);
              drawHandle(maxX + pad, minY - pad);
              drawHandle(maxX + pad, minY + (maxY - minY) / 2);
              drawHandle(maxX + pad, maxY + pad);
              drawHandle(minX + (maxX - minX) / 2, maxY + pad);
              drawHandle(minX - pad, maxY + pad);
              drawHandle(minX - pad, minY + (maxY - minY) / 2);
            }
          }

          // Draw marquee
          if (isMarquee.current) {
            ctx.fillStyle = 'rgba(105, 101, 219, 0.1)';
            ctx.strokeStyle = '#6965db';
            ctx.lineWidth = 1 / state.appState.zoom;
            
            const currentMouse = screenToWorld(lastMousePos.current.x, lastMousePos.current.y, state.appState);
            const w = currentMouse.x - startMousePos.current.x;
            const h = currentMouse.y - startMousePos.current.y;
            
            ctx.fillRect(startMousePos.current.x, startMousePos.current.y, w, h);
            ctx.strokeRect(startMousePos.current.x, startMousePos.current.y, w, h);
          }

          if (state.elements.length === 0) {
            // Draw hint text only if empty
            ctx.fillStyle = '#999';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
              'To move canvas, hold Scroll wheel or Space while dragging, or use the hand tool',
              canvasRef.current.width / 2 / state.appState.zoom - state.appState.scrollX / state.appState.zoom,
              canvasRef.current.height / 2 / state.appState.zoom - state.appState.scrollY / state.appState.zoom
            );
          }
          
          ctx.restore();
        }
        useElementsStore.setState({ dirty: false });
      }
      animationFrameId = requestAnimationFrame(render);
    };
    
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        useElementsStore.setState({ dirty: true });
      }
      if (laserCanvasRef.current) {
        laserCanvasRef.current.width = window.innerWidth;
        laserCanvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const state = useElementsStore.getState();
      const { appState, setAppState } = state;

      if (e.ctrlKey || e.metaKey) {
        const zoomSensitivity = 0.001;
        const zoomDelta = -e.deltaY * zoomSensitivity;
        let newZoom = appState.zoom * (1 + zoomDelta);
        newZoom = Math.max(0.1, Math.min(newZoom, 10));

        const zoomRatio = newZoom / appState.zoom;
        const newScrollX = e.clientX - (e.clientX - appState.scrollX) * zoomRatio;
        const newScrollY = e.clientY - (e.clientY - appState.scrollY) * zoomRatio;

        setAppState({ zoom: newZoom, scrollX: newScrollX, scrollY: newScrollY });
      } else {
        setAppState({
          scrollX: appState.scrollX - e.deltaX,
          scrollY: appState.scrollY - e.deltaY,
        });
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed.current) {
        isSpacePressed.current = true;
        if (canvasRef.current && useElementsStore.getState().appState.activeTool !== 'hand') {
          canvasRef.current.classList.add('cursor-grab');
          canvasRef.current.classList.remove('cursor-default', 'cursor-crosshair');
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressed.current = false;
        if (canvasRef.current && useElementsStore.getState().appState.activeTool !== 'hand') {
          canvasRef.current.classList.remove('cursor-grab');
          canvasRef.current.classList.add(useElementsStore.getState().appState.activeTool === 'select' ? 'cursor-default' : 'cursor-crosshair');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    let laserFrameId: number;
    const renderLaser = () => {
      if (laserCanvasRef.current) {
        const ctx = laserCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, laserCanvasRef.current.width, laserCanvasRef.current.height);
          
          const now = performance.now();
          laserPoints.current = laserPoints.current.filter(p => now - p.timestamp < 800);
          
          if (laserPoints.current.length > 1) {
            const state = useElementsStore.getState();
            ctx.save();
            ctx.translate(state.appState.scrollX, state.appState.scrollY);
            ctx.scale(state.appState.zoom, state.appState.zoom);
            
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff3333';
            ctx.lineWidth = 4 / state.appState.zoom;
            
            for (let i = 1; i < laserPoints.current.length; i++) {
              const p1 = laserPoints.current[i - 1];
              const p2 = laserPoints.current[i];
              const age = now - p2.timestamp;
              const opacity = Math.max(0, 1 - age / 800);
              
              ctx.beginPath();
              ctx.moveTo(p1.x - 10000, p1.y);
              ctx.lineTo(p2.x - 10000, p2.y);
              
              ctx.shadowColor = `rgba(255, 51, 51, ${opacity})`;
              ctx.shadowOffsetX = 10000;
              ctx.shadowOffsetY = 0;
              ctx.shadowBlur = 12;
              
              // Stroke must be opaque to cast a full shadow, but we offset it off-screen
              ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
              ctx.stroke();
            }
            
            ctx.restore();
          }
        }
      }
      laserFrameId = requestAnimationFrame(renderLaser);
    };
    renderLaser();
    return () => cancelAnimationFrame(laserFrameId);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const state = useElementsStore.getState();

    // Close any open context menu when clicking on the canvas
    if (state.appState.contextMenu) {
      state.setAppState({ contextMenu: null });
    }

    const isMiddleClick = e.button === 1;
    
    if (state.appState.activeTool === 'hand' || isMiddleClick || isSpacePressed.current) {
      isPanning.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    const { x, y } = screenToWorld(e.clientX, e.clientY, state.appState);
    startMousePos.current = { x, y };

    if (state.appState.activeTool === 'laser') {
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if (state.appState.activeTool === 'select') {
      const selectedEls = state.elements.filter(el => state.appState.selectedElementIds.includes(el.id));
      const handleHit = hitTestHandle(x, y, selectedEls, state.appState.zoom);
      
      if (handleHit) {
        draggingHandle.current = { elementId: handleHit.element.id, handle: handleHit.handle };
        originalElementsForDrag.current = { [handleHit.element.id]: { ...handleHit.element } };
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }
      
      const hit = hitTest(x, y);
      if (hit) {
        if (!state.appState.selectedElementIds.includes(hit.id)) {
          state.setAppState({ selectedElementIds: [hit.id] });
          originalElementsForDrag.current = { [hit.id]: { ...hit } };
        } else {
          state.appState.selectedElementIds.forEach(id => {
            const el = state.elements.find(el => el.id === id);
            if (el) originalElementsForDrag.current[id] = { ...el };
          });
        }
        isDraggingElements.current = true;
      } else {
        state.setAppState({ selectedElementIds: [] });
        isMarquee.current = true;
      }
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if (state.appState.activeTool === 'text') {
      const newElement: Element = {
        id: nanoid(),
        type: 'text',
        x,
        y,
        width: 100, // min width
        height: 24, // min height
        angle: 0,
        strokeColor: state.appState.currentItemStyle.strokeColor,
        backgroundColor: state.appState.currentItemStyle.backgroundColor,
        strokeWidth: state.appState.currentItemStyle.strokeWidth,
        strokeStyle: 'solid',
        roughness: state.appState.currentItemStyle.roughness,
        opacity: 1,
        isDeleted: false,
        seed: Math.floor(Math.random() * 2 ** 31),
        text: '',
        fontSize: 20,
        fontFamily: 'sans-serif'
      };
      state.addElement(newElement);
      setEditingTextElementId(newElement.id);
      state.setAppState({ activeTool: 'select' }); // Auto switch to select
      return;
    }

    if (['rectangle', 'ellipse', 'diamond', 'arrow', 'line'].includes(state.appState.activeTool)) {
      isDrawing.current = true;

      const newElement: Element = {
        id: nanoid(),
        type: state.appState.activeTool as ElementType,
        x,
        y,
        width: 0,
        height: 0,
        angle: 0,
        strokeColor: state.appState.currentItemStyle.strokeColor,
        backgroundColor: state.appState.currentItemStyle.backgroundColor,
        strokeWidth: state.appState.currentItemStyle.strokeWidth,
        strokeStyle: 'solid',
        roughness: state.appState.currentItemStyle.roughness,
        opacity: 1,
        isDeleted: false,
        seed: Math.floor(Math.random() * 2 ** 31),
      };
      drawingElementId.current = newElement.id;
      state.addElement(newElement);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      
      const state = useElementsStore.getState();
      state.setAppState({
        scrollX: state.appState.scrollX + dx,
        scrollY: state.appState.scrollY + dy,
      });
      
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      return;
    }
    
    const state = useElementsStore.getState();
    if (state.appState.activeTool === 'laser' && e.buttons === 1) {
      const { x, y } = screenToWorld(e.clientX, e.clientY, state.appState);
      laserPoints.current.push({ x, y, timestamp: performance.now() });
      return;
    }

    if (isMarquee.current) {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      const state = useElementsStore.getState();
      
      // Determine selection box
      const currentMouse = screenToWorld(e.clientX, e.clientY, state.appState);
      const minX = Math.min(startMousePos.current.x, currentMouse.x);
      const maxX = Math.max(startMousePos.current.x, currentMouse.x);
      const minY = Math.min(startMousePos.current.y, currentMouse.y);
      const maxY = Math.max(startMousePos.current.y, currentMouse.y);
      
      // Basic bounding box intersection
      const selected = state.elements.filter(el => {
        if (el.isDeleted) return false;
        const elMinX = Math.min(el.x, el.x + el.width);
        const elMaxX = Math.max(el.x, el.x + el.width);
        const elMinY = Math.min(el.y, el.y + el.height);
        const elMaxY = Math.max(el.y, el.y + el.height);
        
        return elMinX <= maxX && elMaxX >= minX && elMinY <= maxY && elMaxY >= minY;
      });
      
      state.setAppState({ selectedElementIds: selected.map(s => s.id) });
      return;
    }

    if (isDrawing.current && drawingElementId.current) {
      const { x, y } = screenToWorld(e.clientX, e.clientY, useElementsStore.getState().appState);
      const state = useElementsStore.getState();
      
      state.updateElement(drawingElementId.current, {
        width: x - startMousePos.current.x,
        height: y - startMousePos.current.y,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    
    if (isPanning.current) {
      isPanning.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    
    const state = useElementsStore.getState();
    
    if (draggingHandle.current) {
      draggingHandle.current = null;
      originalElementsForDrag.current = {};
      state.addHistoryPoint();
      e.currentTarget.releasePointerCapture(e.pointerId);
      return;
    }
    
    if (isDraggingElements.current) {
      isDraggingElements.current = false;
      originalElementsForDrag.current = {};
      state.addHistoryPoint();
      e.currentTarget.releasePointerCapture(e.pointerId);
      return;
    }

    if (state.appState.activeTool === 'laser') {
      e.currentTarget.releasePointerCapture(e.pointerId);
      return;
    }

    if (isMarquee.current) {
      isMarquee.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
      // Ensure dirty flag is set to clear the marquee render
      state.setDirty();
    }
    if (isDrawing.current) {
      isDrawing.current = false;
      
      const el = state.elements.find(e => e.id === drawingElementId.current);
      if (el && el.width === 0 && el.height === 0) {
        state.updateElement(el.id, { isDeleted: true });
      } else if (el) {
        state.setAppState({ selectedElementIds: [el.id] });
        state.addHistoryPoint();
      }
      
      drawingElementId.current = null;
      state.setAppState({ activeTool: 'select' });
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const state = useElementsStore.getState();
    const { x, y } = screenToWorld(e.clientX, e.clientY, state.appState);
    const hit = hitTest(x, y);
    if (hit && hit.type === 'text') {
      setEditingTextElementId(hit.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const state = useElementsStore.getState();
    const { x, y } = screenToWorld(e.clientX, e.clientY, state.appState);
    const hit = hitTest(x, y);
    
    if (hit) {
      if (!state.appState.selectedElementIds.includes(hit.id)) {
        state.setAppState({ selectedElementIds: [hit.id] });
      }
      state.setAppState({ contextMenu: { x: e.clientX, y: e.clientY, type: 'element' } });
    } else {
      state.setAppState({ selectedElementIds: [], contextMenu: { x: e.clientX, y: e.clientY, type: 'canvas' } });
    }
  };

  const editingElement = useElementsStore(state => state.elements.find(e => e.id === editingTextElementId));
  const appState = useElementsStore(state => state.appState);
  
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
        className={useElementsStore((state) => {
          if (state.appState.activeTool === 'hand') return 'cursor-grab active:cursor-grabbing';
          if (['rectangle', 'ellipse', 'diamond', 'arrow', 'line', 'text'].includes(state.appState.activeTool)) return 'cursor-crosshair';
          return 'cursor-default';
        })}
        style={{
          display: 'block',
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          touchAction: 'none'
        }}
      />
      <canvas
        ref={laserCanvasRef}
        className="pointer-events-none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          display: 'block',
          width: '100%',
          height: '100%',
          zIndex: 10
        }}
      />
      {editingElement && editingElement.type === 'text' && (
        <TextEditorOverlay
          element={editingElement}
          appState={appState}
          onCommit={(val) => {
            if (!val || !val.trim()) {
              useElementsStore.getState().updateElement(editingElement.id, { isDeleted: true });
            } else {
              useElementsStore.getState().updateElement(editingElement.id, { text: val.trim() });
            }
            setEditingTextElementId(null);
          }}
        />
      )}
    </div>
  );
};
