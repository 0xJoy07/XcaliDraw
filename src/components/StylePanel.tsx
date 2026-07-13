import React from 'react';
import { useElementsStore } from '../store/elementsStore';

const COLORS = [
  'transparent',
  '#1e1e1e', // black/dark
  '#e03131', // red
  '#2f9e44', // green
  '#1971c2', // blue
  '#f08c00', // orange
];

export const StylePanel = () => {
  const elements = useElementsStore(state => state.elements);
  const appState = useElementsStore(state => state.appState);
  const updateElement = useElementsStore(state => state.updateElement);
  const setAppState = useElementsStore(state => state.setAppState);
  const addHistoryPoint = useElementsStore(state => state.addHistoryPoint);

  const selectedElements = elements.filter(el => appState.selectedElementIds.includes(el.id));
  
  const activeStyle = selectedElements.length > 0
    ? {
        strokeColor: selectedElements[0].strokeColor,
        backgroundColor: selectedElements[0].backgroundColor,
        strokeWidth: selectedElements[0].strokeWidth,
        roughness: selectedElements[0].roughness,
      }
    : appState.currentItemStyle;

  const updateStyle = (key: string, value: string | number) => {
    if (selectedElements.length > 0) {
      selectedElements.forEach(el => {
        updateElement(el.id, { [key]: value });
      });
      addHistoryPoint();
    } else {
      setAppState({
        currentItemStyle: {
          ...appState.currentItemStyle,
          [key]: value
        }
      });
    }
  };

  const isShapeTool = ['rectangle', 'ellipse', 'diamond', 'arrow', 'line', 'freedraw', 'text'].includes(appState.activeTool);
  if (selectedElements.length === 0 && !isShapeTool) {
    return null;
  }

  return (
    <div className="absolute left-4 top-20 bg-ui-bg border border-ui-border rounded-xl shadow-md p-4 w-64 z-10 text-sm flex flex-col gap-4">
      
      {/* Stroke Color */}
      <div className="flex flex-col gap-2">
        <span className="font-medium text-ui-fg-muted text-xs uppercase tracking-wider">Stroke</span>
        <div className="flex gap-1 flex-wrap">
          {COLORS.map(color => (
            <button
              key={`stroke-${color}`}
              className={`w-6 h-6 rounded border transition-transform hover:scale-110 ${
                activeStyle.strokeColor === color ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-ui-bg' : 'border-ui-border'
              }`}
              style={{ backgroundColor: color === 'transparent' ? '#fff' : color }}
              title={color}
              onClick={() => updateStyle('strokeColor', color)}
            >
              {color === 'transparent' && (
                <div className="w-full h-full relative overflow-hidden rounded">
                  <div className="absolute w-[141%] h-px bg-red-500 -rotate-45 top-1/2 left-[-20%]"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Background Color */}
      <div className="flex flex-col gap-2">
        <span className="font-medium text-ui-fg-muted text-xs uppercase tracking-wider">Background</span>
        <div className="flex gap-1 flex-wrap">
          {COLORS.map(color => (
            <button
              key={`bg-${color}`}
              className={`w-6 h-6 rounded border transition-transform hover:scale-110 ${
                activeStyle.backgroundColor === color ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-ui-bg' : 'border-ui-border'
              }`}
              style={{ backgroundColor: color === 'transparent' ? '#fff' : color }}
              title={color}
              onClick={() => updateStyle('backgroundColor', color)}
            >
              {color === 'transparent' && (
                <div className="w-full h-full relative overflow-hidden rounded">
                  <div className="absolute w-[141%] h-px bg-red-500 -rotate-45 top-1/2 left-[-20%]"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stroke Width */}
      <div className="flex flex-col gap-2">
        <span className="font-medium text-ui-fg-muted text-xs uppercase tracking-wider">Stroke Width</span>
        <div className="flex gap-2 bg-ui-bg-hover p-1 rounded-lg">
          {[1, 2, 4].map(width => (
            <button
              key={`width-${width}`}
              className={`flex-1 flex items-center justify-center py-2 rounded-md ${
                activeStyle.strokeWidth === width ? 'bg-ui-bg shadow-sm text-indigo-500' : 'text-ui-fg hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              onClick={() => updateStyle('strokeWidth', width)}
            >
              <div 
                className="bg-current rounded-full" 
                style={{ width: 16, height: width }} 
              />
            </button>
          ))}
        </div>
      </div>

      {/* Roughness */}
      <div className="flex flex-col gap-2">
        <span className="font-medium text-ui-fg-muted text-xs uppercase tracking-wider">Style</span>
        <div className="flex gap-2 bg-ui-bg-hover p-1 rounded-lg">
          {[0, 1, 2].map(roughness => (
            <button
              key={`roughness-${roughness}`}
              className={`flex-1 py-1 text-xs rounded-md ${
                activeStyle.roughness === roughness ? 'bg-ui-bg shadow-sm text-indigo-500' : 'text-ui-fg hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              onClick={() => updateStyle('roughness', roughness)}
            >
              {roughness === 0 ? 'Clean' : roughness === 1 ? 'Hand' : 'Rough'}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
