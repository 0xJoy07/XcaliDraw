import { Canvas } from './canvas/Canvas';
import { useElementsStore } from './store/elementsStore';

function App() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Canvas />
      
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 flex gap-2">
        <button className="px-3 py-2 border border-gray-300 rounded bg-white cursor-pointer hover:bg-gray-50">☰</button>
      </div>
      
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 bg-white p-2 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
        {(['hand', 'select', 'rectangle', 'ellipse', 'diamond', 'arrow', 'line'] as const).map((tool) => (
          <button 
            key={tool}
            onClick={() => useElementsStore.getState().setAppState({ activeTool: tool })}
            className={`px-3 py-2 border rounded cursor-pointer capitalize ${
              useElementsStore((state) => state.appState.activeTool) === tool 
                ? 'bg-blue-100 border-blue-500' 
                : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tool}
          </button>
        ))}
      </div>
      
      <div className="absolute top-4 right-4 flex gap-2">
        <button className="px-3 py-2 border border-gray-300 rounded bg-white cursor-pointer hover:bg-gray-50">Share</button>
        <button className="px-3 py-2 border border-[#6965db] rounded bg-[#6965db] text-white cursor-pointer hover:bg-[#5b57c6]">XcaliDraw+</button>
      </div>
    </div>
  );
}

export default App;
