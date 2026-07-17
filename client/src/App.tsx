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
import { Link, useParams, useNavigate } from 'react-router-dom';
import { BookOpenCheck, LogOut, Moon, Sun, Menu, Share2, Shield, Eye, Edit2, LayoutGrid } from 'lucide-react';
import { Toolbar } from './components/Toolbar';
import { useAuth } from './auth/AuthContext';
import { getCanvas, getSharedCanvas, type SavedCanvas, type CanvasAccessRole } from './lib/canvasApi';
import { useCanvasAutosave } from './hooks/useCanvasAutosave';
import { ShareModal } from './components/ShareModal';
import { SaveStatusBadge } from './components/ui/SaveStatusBadge';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  
  const navigate = useNavigate();
  const { canvasId, shareToken } = useParams();
  const { user, accessToken, logout, authenticatedFetch } = useAuth();
  
  const [canvasAccessRole, setCanvasAccessRole] = useState<CanvasAccessRole>('none');
  const [currentCanvas, setCurrentCanvas] = useState<SavedCanvas | null>(null);

  const targetCanvasId = canvasId || currentCanvas?.id;
  const isEditingAllowed = canvasAccessRole === 'owner' || canvasAccessRole === 'editor';
  
  const { saveStatus, flush } = useCanvasAutosave(targetCanvasId, canvasReady && isEditingAllowed, authenticatedFetch);

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

  useEffect(() => {
    if (!canvasId && !shareToken) return;
    let cancelled = false;

    setCanvasReady(false);
    setLoadError('');

    const fetchPromise = shareToken 
      ? getSharedCanvas(shareToken, accessToken)
      : getCanvas(authenticatedFetch, canvasId!);

    fetchPromise
      .then((response) => {
        if (cancelled) return;
        
        const role = response.canvas.role || 'owner';
        setCanvasAccessRole(role);
        setCurrentCanvas(response.canvas);
        
        // If viewer, lock canvas and disable drawing
        if (role === 'viewer') {
          useElementsStore.getState().setAppState({ 
            isToolLocked: true,
            activeTool: 'hand'
          });
        }
        
        useElementsStore.getState().hydrateCanvas(response.canvas.elements, response.canvas.appState);
        setCanvasReady(true);
      })
      .catch((caught) => {
        if (cancelled) return;
        setLoadError((caught as Error).message || 'Could not load canvas');
        setCanvasAccessRole('none');
      });

    return () => {
      cancelled = true;
    };
  }, [authenticatedFetch, canvasId, shareToken, accessToken]);

  if (loadError) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas-bg text-ui-fg">
        <div className="border border-ui-border bg-ui-bg p-6 shadow-sm rounded-lg max-w-sm w-full text-center">
          <p className="font-medium text-lg">Access Denied</p>
          <p className="mt-2 text-sm text-ui-fg-muted">{loadError}</p>
          {(!user && canvasAccessRole === 'none') ? (
            <div className="mt-6 flex flex-col gap-2">
              <Link to="/login" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">Log in</Link>
              <Link to="/" className="px-4 py-2 border border-ui-border rounded-md text-sm font-medium hover:bg-ui-bg-hover">Back to home</Link>
            </div>
          ) : (
            <Link to="/" className="mt-4 inline-block px-4 py-2 border border-ui-border rounded-md text-sm font-medium hover:bg-ui-bg-hover">Back to canvases</Link>
          )}
        </div>
      </div>
    );
  }

  if (!canvasReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas-bg text-ui-fg">
        Loading canvas...
      </div>
    );
  }

  const roleBadge = () => {
    switch (canvasAccessRole) {
      case 'owner': return <span className="flex items-center justify-center gap-1.5 h-[44px] text-sm font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 px-3 rounded-lg shadow-sm"><Shield size={16}/> Owner</span>;
      case 'editor': return <span className="flex items-center justify-center gap-1.5 h-[44px] text-sm font-semibold bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 px-3 rounded-lg shadow-sm"><Edit2 size={16}/> Editing</span>;
      case 'viewer': return <span className="flex items-center justify-center gap-1.5 h-[44px] text-sm font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-3 rounded-lg shadow-sm"><Eye size={16}/> Viewing Only</span>;
      default: return null;
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden text-ui-fg">
      <Canvas readOnly={canvasAccessRole === 'viewer'} />
      {canvasAccessRole !== 'viewer' && (
        <SettingsPanel isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      )}
      <ZoomIndicator />
      {canvasAccessRole !== 'viewer' && <ContextMenu />}
      {canvasAccessRole !== 'viewer' && <StylePanel />}
      <FindDialog />
      <HelpDialog />
      
      {/* Top Header Layer */}
      <div className="absolute top-4 inset-x-4 flex flex-col md:flex-row justify-between items-center gap-4 z-10 pointer-events-none">
        
        {/* Top Left Menu */}
        <div className="flex items-center gap-2 pointer-events-auto w-full md:w-auto justify-start">
          {canvasAccessRole !== 'viewer' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsSidebarOpen(!isSidebarOpen);
              }}
              className="flex items-center justify-center w-[44px] h-[44px] border border-ui-border rounded-lg bg-ui-bg text-ui-fg cursor-pointer hover:bg-ui-bg-hover shadow-sm transition-colors"
            >
              <Menu size={20} />
            </button>
          )}
          
          {user ? (
            <button
              onClick={async () => {
                navigate('/dashboard');
                await flush();
              }}
              className="flex items-center justify-center gap-2 h-[44px] rounded-lg border border-ui-border bg-ui-bg px-3 text-sm font-medium shadow-sm hover:bg-ui-bg-hover transition-colors"
            >
              <LayoutGrid size={16} />
              Dashboard
            </button>
          ) : (
            <Link
              to="/"
              className="flex items-center justify-center h-[44px] rounded-lg border border-ui-border bg-ui-bg px-3 text-sm font-medium shadow-sm hover:bg-ui-bg-hover transition-colors"
            >
              Home
            </Link>
          )}
          
          <div className="flex items-center h-[44px]">
            {roleBadge()}
          </div>

          {isEditingAllowed && (
            <div className="hidden sm:block">
              <SaveStatusBadge status={saveStatus} />
            </div>
          )}
        </div>

        {/* Centered Floating Toolbar */}
        {canvasAccessRole !== 'viewer' && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:static md:translate-x-0 pointer-events-auto flex-shrink-0 mx-auto w-[calc(100vw-2rem)] md:w-auto overflow-x-auto hide-scrollbar z-20 pb-[env(safe-area-inset-bottom)] md:pb-0">
            <Toolbar />
          </div>
        )}
        
        {/* Top Right Actions */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 pointer-events-auto w-full md:w-auto">
          {user ? (
            <div className="hidden lg:flex items-center gap-2 rounded-lg border border-ui-border bg-ui-bg px-3 py-1.5 text-sm shadow-sm">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-5 w-5 rounded-full" referrerPolicy="no-referrer" />
              ) : null}
              <span className="max-w-32 truncate">{user.name || user.email}</span>
              <button
                onClick={async () => {
                  navigate('/');
                  await logout();
                }}
                className="rounded-md p-1 hover:bg-ui-bg-hover"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm">
              Log in
            </Link>
          )}

          <div className="flex bg-ui-bg rounded-lg shadow-sm border border-ui-border p-1 transition-colors">
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-1.5 rounded-md text-ui-fg hover:bg-ui-bg-hover transition-colors"
              title="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
          
          {canvasAccessRole === 'owner' && (
            <button 
              onClick={() => setIsShareModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-ui-border rounded-lg bg-ui-bg text-ui-fg text-sm font-medium hover:bg-ui-bg-hover shadow-sm cursor-pointer transition-colors"
            >
              <Share2 size={16} /> Share
            </button>
          )}
          
          <Link 
            to="/docs" 
            target="_blank"
            className="flex items-center gap-2 px-3 py-1.5 border border-indigo-600 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-sm cursor-pointer transition-colors"
          >
           <BookOpenCheck size={16} />
           <span className="hidden sm:inline">Docs</span>
          </Link>
        </div>
      </div>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        canvas={currentCanvas}
        onCanvasUpdate={setCurrentCanvas}
        theme={theme}
      />

      <Toasts />
    </div>
  );
}

export default App;
