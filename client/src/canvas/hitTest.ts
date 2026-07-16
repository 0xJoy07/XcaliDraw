import RBush from 'rbush';
import type { Element } from '../types/element';

export interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  element: Element;
}

export const rbushTree = new RBush<BBox>();

export const updateRbush = (elements: Element[]) => {
  rbushTree.clear();
  const bboxes = elements.filter(e => !e.isDeleted).map(e => {
    let minX = Math.min(e.x, e.x + e.width);
    let maxX = Math.max(e.x, e.x + e.width);
    let minY = Math.min(e.y, e.y + e.height);
    let maxY = Math.max(e.y, e.y + e.height);
    
    // Add padding for thin strokes
    const padding = 8;
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
      element: e
    };
  });
  rbushTree.load(bboxes);
};

export const hitTest = (x: number, y: number): Element | null => {
  const padding = 5;
  const results = rbushTree.search({
    minX: x - padding,
    minY: y - padding,
    maxX: x + padding,
    maxY: y + padding
  });
  
  if (results.length === 0) return null;
  return results[results.length - 1].element;
};

export const hitTestHandle = (x: number, y: number, selectedElements: Element[], zoom: number): { element: Element, handle: string } | null => {
  const pad = 8;
  const handleSize = 8 / zoom;
  const touchTolerance = Math.max(22 / zoom, handleSize / 2 + 2);
  
  for (let i = selectedElements.length - 1; i >= 0; i--) {
    const e = selectedElements[i];
    let minX = Math.min(e.x, e.x + e.width);
    let maxX = Math.max(e.x, e.x + e.width);
    let minY = Math.min(e.y, e.y + e.height);
    let maxY = Math.max(e.y, e.y + e.height);
    
    const handles = [
      { name: 'nw', x: minX - pad, y: minY - pad },
      { name: 'n', x: minX + (maxX - minX) / 2, y: minY - pad },
      { name: 'ne', x: maxX + pad, y: minY - pad },
      { name: 'e', x: maxX + pad, y: minY + (maxY - minY) / 2 },
      { name: 'se', x: maxX + pad, y: maxY + pad },
      { name: 's', x: minX + (maxX - minX) / 2, y: maxY + pad },
      { name: 'sw', x: minX - pad, y: maxY + pad },
      { name: 'w', x: minX - pad, y: minY + (maxY - minY) / 2 }
    ];
    
    for (const h of handles) {
      if (Math.abs(x - h.x) <= touchTolerance && Math.abs(y - h.y) <= touchTolerance) {
        return { element: e, handle: h.name };
      }
    }
  }
  return null;
};
