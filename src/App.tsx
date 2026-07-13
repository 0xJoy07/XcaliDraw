import { useEffect, useState } from 'react';
import { Canvas } from './canvas/Canvas';
import { useElementsStore } from './store/elementsStore';
import { SettingsPanel } from './components/SettingsPanel';
import { ZoomIndicator } from './components/ZoomIndicator';
import { ContextMenu } from './components/ContextMenu';
import { StylePanel } from './components/StylePanel';
import { 
  Lock, Hand, MousePointer2, Square, Diamond, Circle, 
  MoveRight, Minus, Pen, Type, Image as ImageIcon, Eraser,
  Library, Moon, Sun, Menu, Share2, Zap
} from 'lucide-react';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Detect system theme
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(darkQuery.matches ? 'dark' : 'light');
    
    const listener = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    darkQuery.addEventListener('change', listener);
    return () => darkQuery.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    useElementsStore.getState().setDirty(); // Force canvas to redraw with new background
  }, [theme]);

  const activeTool = useElementsStore((state) => state.appState.activeTool);
  const setAppState = useElementsStore((state) => state.setAppState);

  const ToolButton = ({ tool, icon: Icon, label, shortcut }: { tool?: any, icon: any, label?: string, shortcut?: string }) => {
    const isActive = tool && activeTool === tool;
    return (
      <button 
        onClick={() => tool && setAppState({ activeTool: tool })}
        title={label ? `${label} ${shortcut ? `(${shortcut})` : ''}` : undefined}
        className={`p-2 flex items-center justify-center rounded-lg transition-colors relative ${
          isActive 
            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' 
            : 'text-ui-fg hover:bg-ui-bg-hover'
        }`}
      >
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        {shortcut && (
          <span className="absolute bottom-0.5 right-0.5 text-[9px] text-ui-fg-muted font-medium select-none pointer-events-none">
            {shortcut}
          </span>
        )}
      </button>
    );
  };

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden text-ui-fg"
    >
      <Canvas />
      <SettingsPanel isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <ZoomIndicator />
      <ContextMenu />
      <StylePanel />
      
      {/* Top Left Menu */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsSidebarOpen(!isSidebarOpen);
          }}
          className="p-2 border border-ui-border rounded-lg bg-ui-bg text-ui-fg cursor-pointer hover:bg-ui-bg-hover shadow-sm transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>
      
      {/* Centered Floating Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-ui-bg p-1.5 rounded-xl shadow-md border border-ui-border z-10 transition-colors">
        <ToolButton icon={Lock} label="Keep tool active" />
        <div className="w-px h-6 bg-ui-border mx-1 transition-colors"></div>
        <ToolButton tool="hand" icon={Hand} label="Hand (Pan)" />
        <ToolButton tool="select" icon={MousePointer2} label="Select" shortcut="1" />
        <ToolButton tool="rectangle" icon={Square} label="Rectangle" shortcut="2" />
        <ToolButton tool="diamond" icon={Diamond} label="Diamond" shortcut="3" />
        <ToolButton tool="ellipse" icon={Circle} label="Ellipse" shortcut="4" />
        <ToolButton tool="arrow" icon={MoveRight} label="Arrow" shortcut="5" />
        <ToolButton tool="line" icon={Minus} label="Line" shortcut="6" />
        <ToolButton tool="freedraw" icon={Pen} label="Draw" shortcut="7" />
        <ToolButton tool="text" icon={Type} label="Text" shortcut="8" />
        <ToolButton tool="image" icon={ImageIcon} label="Image" shortcut="9" />
        <ToolButton tool="eraser" icon={Eraser} label="Eraser" shortcut="0" />
        <ToolButton tool="laser" icon={Zap} label="Laser Pointer" shortcut="l" />
        <div className="w-px h-6 bg-ui-border mx-1 transition-colors"></div>
        <ToolButton icon={Library} label="Library" />
      </div>
      
      {/* Top Right Actions */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
        <div className="flex bg-ui-bg rounded-lg shadow-sm border border-ui-border p-1 transition-colors">
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-1.5 rounded-md text-ui-fg hover:bg-ui-bg-hover transition-colors"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
        
        <button className="flex items-center gap-2 px-3 py-1.5 border border-ui-border rounded-lg bg-ui-bg text-ui-fg text-sm font-medium hover:bg-ui-bg-hover shadow-sm cursor-pointer transition-colors">
          <Share2 size={16} /> Share
        </button>
        
        <button className="flex items-center gap-2 px-3 py-1.5 border border-indigo-600 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-sm cursor-pointer transition-colors">
         AI Optimize
        </button>
      </div>
    </div>
  );
}

export default App;
