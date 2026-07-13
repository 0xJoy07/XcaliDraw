import type { Element } from '../types/element';
import type { RoughCanvas } from 'roughjs/bin/canvas';

export const renderElement = (rc: RoughCanvas, ctx: CanvasRenderingContext2D, element: Element) => {
  if (element.isDeleted) return;

  const options = {
    seed: element.seed,
    stroke: element.strokeColor || '#000000',
    fill: element.backgroundColor !== 'transparent' ? element.backgroundColor : undefined,
    strokeWidth: element.strokeWidth || 1,
    roughness: element.roughness ?? 1,
    strokeLineDash: element.strokeStyle === 'dashed' ? [8, 8] : element.strokeStyle === 'dotted' ? [2, 6] : undefined,
  };

  ctx.save();
  ctx.globalAlpha = element.opacity ?? 1;
  ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
  ctx.rotate(element.angle || 0);
  ctx.translate(-(element.x + element.width / 2), -(element.y + element.height / 2));

  if (element.type === 'rectangle') {
    rc.rectangle(element.x, element.y, element.width, element.height, options);
  } else if (element.type === 'ellipse') {
    rc.ellipse(element.x + element.width / 2, element.y + element.height / 2, element.width, element.height, options);
  } else if (element.type === 'diamond') {
    // simplified diamond
    rc.polygon([
      [element.x + element.width / 2, element.y],
      [element.x + element.width, element.y + element.height / 2],
      [element.x + element.width / 2, element.y + element.height],
      [element.x, element.y + element.height / 2],
    ], options);
  } else if (element.type === 'line' || element.type === 'arrow') {
    rc.line(element.x, element.y, element.x + element.width, element.y + element.height, options);
    if (element.type === 'arrow') {
         const angle = Math.atan2(element.height, element.width);
         const headLen = 15;
         rc.line(element.x + element.width, element.y + element.height, 
                 element.x + element.width - headLen * Math.cos(angle - Math.PI / 6), 
                 element.y + element.height - headLen * Math.sin(angle - Math.PI / 6), options);
         rc.line(element.x + element.width, element.y + element.height, 
                 element.x + element.width - headLen * Math.cos(angle + Math.PI / 6), 
                 element.y + element.height - headLen * Math.sin(angle + Math.PI / 6), options);
      }
  } else if (element.type === 'text') {
    ctx.font = `${element.fontSize || 20}px ${element.fontFamily || 'sans-serif'}`;
    ctx.fillStyle = element.strokeColor;
    ctx.textBaseline = 'top';
    const lines = (element.text || '').split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, element.x, element.y + i * (element.fontSize || 20) * 1.2);
    });
  }
  ctx.restore();
};
