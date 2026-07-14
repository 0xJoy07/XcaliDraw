import { useEffect, useState } from 'react';
import { Canvas } from './canvas/Canvas';
import { useElementsStore } from './store/elementsStore';
import { SettingsPanel } from './components/SettingsPanel';
import { ZoomIndicator } from './components/ZoomIndicator';
import { ContextMenu } from './components/ContextMenu';
import { StylePanel } from './components/StylePanel';
import { FindDialog } from './components/FindDialog';
import { HelpDialog } from './components/HelpDialog';
import { Toasts } from './components/Toasts';
import { Link } from 'react-router-dom';
import { BookOpenCheck } from 'lucide-react';
import { 
  Moon, Sun, Menu, Share2
} from 'lucide-react';
import { Toolbar } from './components/Toolbar';

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



  return (
    <div 
      className="relative w-screen h-screen overflow-hidden text-ui-fg"
    >
      <Canvas />
      <SettingsPanel isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <ZoomIndicator />
      <ContextMenu />
      <StylePanel />
      <FindDialog />
      <HelpDialog />
      
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
      <Toolbar />
      
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
        
        <Link 
          to="/docs" 
          target="_blank"
          className="flex items-center gap-2 px-3 py-1.5 border border-indigo-600 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-sm cursor-pointer transition-colors"
        >
         <BookOpenCheck size={16} />
         Documentations
        </Link>
      </div>
      <Toasts />
    </div>
  );
}

export default App;
