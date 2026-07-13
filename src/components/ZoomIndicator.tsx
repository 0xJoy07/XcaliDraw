import { useElementsStore } from '../store/elementsStore';
import { Minus, Plus, Undo2, Redo2 } from 'lucide-react';

export const ZoomIndicator = () => {
  const zoom = useElementsStore((state) => state.appState.zoom);
  const setAppState = useElementsStore((state) => state.setAppState);

  const handleZoomOut = () => {
    setAppState({ zoom: Math.max(0.1, zoom - 0.1) });
  };

  const handleZoomIn = () => {
    setAppState({ zoom: Math.min(10, zoom + 0.1) });
  };

  const handleReset = () => {
    setAppState({ zoom: 1 });
  };

  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
      <div className="flex items-center bg-ui-bg border border-ui-border rounded-lg shadow-sm transition-colors">
        <button 
          onClick={() => useElementsStore.getState().undo()}
          className="p-1.5 text-ui-fg hover:bg-ui-bg-hover rounded-l-lg transition-colors border-r border-ui-border"
          title="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button 
          onClick={() => useElementsStore.getState().redo()}
          className="p-1.5 text-ui-fg hover:bg-ui-bg-hover rounded-r-lg transition-colors"
          title="Redo"
        >
          <Redo2 size={16} />
        </button>
      </div>

      <div className="flex items-center bg-ui-bg border border-ui-border rounded-lg shadow-sm transition-colors">
        <button 
          onClick={handleZoomOut}
          className="p-1.5 text-ui-fg hover:bg-ui-bg-hover rounded-l-lg transition-colors border-r border-ui-border"
          title="Zoom Out"
        >
          <Minus size={16} />
        </button>
        <button 
          onClick={handleReset}
          className="px-3 py-1.5 text-xs font-medium text-ui-fg hover:bg-ui-bg-hover transition-colors min-w-[3.5rem] text-center"
          title="Reset Zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button 
          onClick={handleZoomIn}
          className="p-1.5 text-ui-fg hover:bg-ui-bg-hover rounded-r-lg transition-colors border-l border-ui-border"
          title="Zoom In"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};
