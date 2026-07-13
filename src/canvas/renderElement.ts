import type { Element } from '../types/element';
import type { RoughCanvas } from 'roughjs/bin/canvas';

// Cache for loaded images
export const imageCache: Record<string, HTMLImageElement> = {};

export const renderElement = (rc: RoughCanvas, ctx: CanvasRenderingContext2D, element: Element) => {
  if (element.isDeleted) return;

  const options = {
    seed: element.seed,
    stroke: element.strokeColor || '#1e1e1e',
    fill: element.backgroundColor && element.backgroundColor !== 'transparent' ? element.backgroundColor : undefined,
    fillStyle: 'solid' as const,
    strokeWidth: element.strokeWidth || 1,
    roughness: element.roughness ?? 1,
    strokeLineDash: element.strokeStyle === 'dashed' ? [8, 8] : element.strokeStyle === 'dotted' ? [2, 6] : undefined,
  };

  ctx.save();
  ctx.globalAlpha = element.opacity ?? 1;

  // Apply rotation around element center
  if (element.angle) {
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate(element.angle);
    ctx.translate(-cx, -cy);
  }

  switch (element.type) {
    case 'rectangle':
      rc.rectangle(element.x, element.y, element.width, element.height, options);
      break;

    case 'ellipse':
      rc.ellipse(element.x + element.width / 2, element.y + element.height / 2, element.width, element.height, options);
      break;

    case 'diamond':
      rc.polygon([
        [element.x + element.width / 2, element.y],
        [element.x + element.width,     element.y + element.height / 2],
        [element.x + element.width / 2, element.y + element.height],
        [element.x,                      element.y + element.height / 2],
      ], options);
      break;

    case 'line':
      rc.line(element.x, element.y, element.x + element.width, element.y + element.height, options);
      break;

    case 'arrow': {
      rc.line(element.x, element.y, element.x + element.width, element.y + element.height, options);
      const angle = Math.atan2(element.height, element.width);
      const headLen = Math.max(12, Math.min(24, Math.hypot(element.width, element.height) * 0.15));
      const ex = element.x + element.width, ey = element.y + element.height;
      rc.line(ex, ey, ex - headLen * Math.cos(angle - Math.PI / 6), ey - headLen * Math.sin(angle - Math.PI / 6), options);
      rc.line(ex, ey, ex - headLen * Math.cos(angle + Math.PI / 6), ey - headLen * Math.sin(angle + Math.PI / 6), options);
      break;
    }

    case 'freedraw': {
      const pts = element.points;
      if (!pts || pts.length < 2) break;
      ctx.beginPath();
      ctx.moveTo(element.x + pts[0].x, element.y + pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(element.x + pts[i].x, element.y + pts[i].y);
      }
      ctx.strokeStyle = element.strokeColor || '#1e1e1e';
      ctx.lineWidth = element.strokeWidth || 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      break;
    }

    case 'text': {
      const fontSize = element.fontSize || 20;
      ctx.font = `${fontSize}px ${element.fontFamily || 'sans-serif'}`;
      ctx.fillStyle = element.strokeColor || '#1e1e1e';
      ctx.textBaseline = 'top';
      const textAlign = element.textAlign || 'left';
      ctx.textAlign = textAlign as CanvasTextAlign;
      const lines = (element.text || '').split('\n');
      
      lines.forEach((line, i) => {
        let x = element.x;
        if (textAlign === 'center') x += element.width / 2;
        if (textAlign === 'right') x += element.width;
        ctx.fillText(line, x, element.y + i * fontSize * 1.25);
      });
      break;
    }

    case 'image': {
      const src = element.fileId;
      if (!src) break;
      if (!imageCache[src]) {
        const img = new Image();
        img.onload = () => {
          imageCache[src] = img;
          useElementsStoreDirty();
        };
        img.src = src;
        break;
      }
      const img = imageCache[src];
      ctx.drawImage(img, element.x, element.y, element.width, element.height);
      break;
    }
  }

  ctx.restore();
};

// Minimal dirty trigger for async image load (avoids circular dep)
let _dirty: (() => void) | null = null;
export const setDirtyCallback = (fn: () => void) => { _dirty = fn; };
const useElementsStoreDirty = () => { if (_dirty) _dirty(); };
