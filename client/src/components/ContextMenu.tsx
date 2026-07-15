import { nanoid } from 'nanoid';
import { useElementsStore } from '../store/elementsStore';

export const ContextMenu = () => {
  const contextMenu = useElementsStore((state) => state.appState.contextMenu);
  const setAppState = useElementsStore((state) => state.setAppState);
  
  if (!contextMenu) return null;

  const handleClose = () => setAppState({ contextMenu: null });

  return (
    <div 
      className="fixed bg-ui-bg border border-ui-border rounded-lg shadow-xl py-1.5 z-[100] text-ui-fg text-sm min-w-[180px]"
      style={{ left: contextMenu.x, top: contextMenu.y }}
      onPointerDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {contextMenu.type === 'element' ? (
        <>
          <button 
            className="w-full text-left px-4 py-2 hover:bg-ui-bg-hover transition-colors flex items-center gap-2" 
            onClick={() => {
              const state = useElementsStore.getState();
              const selected = state.appState.selectedElementIds;
              if (selected.length > 0) {
                const others = state.elements.filter(el => !selected.includes(el.id) || el.isDeleted);
                const front = state.elements.filter(el => selected.includes(el.id) && !el.isDeleted);
                useElementsStore.setState({ elements: [...others, ...front], dirty: true });
              }
              handleClose();
            }}
          >
            Bring to Front
          </button>
          <button 
            className="w-full text-left px-4 py-2 hover:bg-ui-bg-hover transition-colors flex items-center gap-2"
            onClick={() => {
              const state = useElementsStore.getState();
              const selected = state.appState.selectedElementIds;
              const back = state.elements.filter(el => selected.includes(el.id) && !el.isDeleted);
              const others = state.elements.filter(el => !selected.includes(el.id) || el.isDeleted);
              useElementsStore.setState({ elements: [...back, ...others], dirty: true });
              handleClose();
            }}
          >
            Send to Back
          </button>
          <div className="h-px w-full bg-ui-border my-1.5 mx-0"></div>
          <button 
            className="w-full text-left px-4 py-2 hover:bg-ui-bg-hover transition-colors flex items-center gap-2"
            onClick={() => {
              const state = useElementsStore.getState();
              const selected = state.elements.filter(el => state.appState.selectedElementIds.includes(el.id) && !el.isDeleted);
              if (selected.length > 0) {
                const copies = selected.map(el => ({ ...el, id: nanoid(), x: el.x + 20, y: el.y + 20 }));
                copies.forEach(copy => state.addElement(copy));
                state.setAppState({ selectedElementIds: copies.map(c => c.id) });
                state.addHistoryPoint();
              }
              handleClose();
            }}
          >
            Duplicate
          </button>
          <div className="h-px w-full bg-ui-border my-1.5 mx-0"></div>
          <button 
            className="w-full text-left px-4 py-2 hover:bg-ui-bg-hover text-red-500 transition-colors flex items-center gap-2"
            onClick={() => {
              const state = useElementsStore.getState();
              state.appState.selectedElementIds.forEach(id => state.updateElement(id, { isDeleted: true }));
              state.setAppState({ selectedElementIds: [], contextMenu: null });
              state.addHistoryPoint();
            }}
          >
            Delete
          </button>
        </>
      ) : (
        <>
          <button 
            className="w-full text-left px-4 py-2 hover:bg-ui-bg-hover transition-colors flex items-center gap-2"
            onClick={() => {
              const state = useElementsStore.getState();
              const allIds = state.elements.filter(el => !el.isDeleted).map(el => el.id);
              state.setAppState({ selectedElementIds: allIds });
              handleClose();
            }}
          >
            Select All
          </button>
          <button 
            className="w-full text-left px-4 py-2 hover:bg-ui-bg-hover transition-colors flex items-center gap-2"
            onClick={() => {
              useElementsStore.getState().setAppState({ zoom: 1, scrollX: 0, scrollY: 0 });
              handleClose();
            }}
          >
            Reset View
          </button>
          <div className="h-px w-full bg-ui-border my-1.5 mx-0"></div>
          <button 
            className="w-full text-left px-4 py-2 hover:bg-ui-bg-hover text-red-500 transition-colors flex items-center gap-2"
            onClick={() => {
              const state = useElementsStore.getState();
              const activeCount = state.elements.filter(el => !el.isDeleted).length;
              if (activeCount > 0 && window.confirm('Clear all elements from canvas?')) {
                state.elements.filter(el => !el.isDeleted).forEach(el => state.updateElement(el.id, { isDeleted: true }));
                state.setAppState({ selectedElementIds: [] });
                state.addHistoryPoint();
              }
              handleClose();
            }}
          >
            Clear Canvas
          </button>
        </>
      )}
    </div>
  );
};
