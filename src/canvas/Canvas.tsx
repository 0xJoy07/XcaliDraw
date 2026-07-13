import React, { useEffect, useRef } from 'react';
import { useElementsStore } from '../store/elementsStore';
import { nanoid } from 'nanoid';
import type { Element, ElementType } from '../types/element';
import rough from 'roughjs';
import { renderElement } from './renderElement';

export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPanning = useRef(false);
  const isDrawing = useRef(false);
  const drawingElementId = useRef<string | null>(null);
  const startMousePos = useRef({ x: 0, y: 0 });
  const lastMousePos = useRef({ x: 0, y: 0 });
  const isSpacePressed = useRef(false);

  useEffect(() => {
    let animationFrameId: number;
    
    const render = () => {
      const state = useElementsStore.getState();
      if (state.dirty && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          ctx.save();
          ctx.translate(state.appState.scrollX, state.appState.scrollY);
          ctx.scale(state.appState.zoom, state.appState.zoom);
          
          const rc = rough.canvas(canvasRef.current);
          state.elements.forEach(el => renderElement(rc, ctx, el));

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

  const getCanvasPos = (clientX: number, clientY: number) => {
    const state = useElementsStore.getState();
    const { zoom, scrollX, scrollY } = state.appState;
    return {
      x: (clientX - scrollX) / zoom,
      y: (clientY - scrollY) / zoom,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const state = useElementsStore.getState();
    const isMiddleClick = e.button === 1;
    
    if (state.appState.activeTool === 'hand' || isMiddleClick || isSpacePressed.current) {
      isPanning.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if (['rectangle', 'ellipse', 'diamond', 'arrow', 'line'].includes(state.appState.activeTool)) {
      isDrawing.current = true;
      const { x, y } = getCanvasPos(e.clientX, e.clientY);
      startMousePos.current = { x, y };

      const newElement: Element = {
        id: nanoid(),
        type: state.appState.activeTool as ElementType,
        x,
        y,
        width: 0,
        height: 0,
        angle: 0,
        strokeColor: '#000000',
        backgroundColor: 'transparent',
        strokeWidth: 1,
        strokeStyle: 'solid',
        roughness: 1,
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

    if (isDrawing.current && drawingElementId.current) {
      const { x, y } = getCanvasPos(e.clientX, e.clientY);
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
    if (isDrawing.current) {
      isDrawing.current = false;
      
      // Cleanup elements that have no size to avoid zero-size specks
      const state = useElementsStore.getState();
      const el = state.elements.find(e => e.id === drawingElementId.current);
      if (el && el.width === 0 && el.height === 0) {
        state.updateElement(el.id, { isDeleted: true });
      }
      
      drawingElementId.current = null;
      // Switch back to select tool after drawing
      state.setAppState({ activeTool: 'select' });
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={useElementsStore((state) => {
        if (state.appState.activeTool === 'hand') return 'cursor-grab active:cursor-grabbing';
        if (['rectangle', 'ellipse', 'diamond', 'arrow', 'line'].includes(state.appState.activeTool)) return 'cursor-crosshair';
        return 'cursor-default';
      })}
      style={{
        display: 'block',
        width: '100vw',
        height: '100vh',
        touchAction: 'none'
      }}
    />
  );
};
