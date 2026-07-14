import { useEffect, useRef, useState } from 'react';
import { 
  FolderOpen, Save, Download, Terminal, Search, HelpCircle, RotateCcw,
  GitFork, X as XIcon, MessageSquare, UserPlus, ChevronDown, ChevronUp,
  Moon, Sun, Monitor
} from 'lucide-react';
import { useElementsStore } from '../store/elementsStore';
import { nanoid } from 'nanoid';
import { imageCache } from '../canvas/renderElement';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const BG_COLORS = ['#f8f9fa', '#e9ecef', '#dee2e6', '#ffe3e3', '#eebefa', '#d0ebff', '#121212', '#1e1e1e'];

export const SettingsPanel = ({ isOpen, onClose }: SettingsPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(true);
  const setDirty = useElementsStore(state => state.setDirty);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      setTimeout(() => window.addEventListener('click', handleClickOutside), 0);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const SectionItem = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) => (
    <button 
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-ui-fg hover:bg-ui-bg-hover rounded-lg transition-colors"
    >
      <Icon size={16} className="text-ui-fg-muted" />
      <span className="font-medium">{label}</span>
    </button>
  );

  const handleOpen = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,text/*,application/*,.json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      if (file.type.startsWith('video/')) {
        alert('Video files are not supported.');
        return;
      }

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const src = ev.target?.result as string;
          if (!src) return;
          const img = new Image();
          img.onload = () => {
            imageCache[src] = img;
            const state = useElementsStore.getState();
            const { appState } = state;
            const cx = (window.innerWidth / 2 - appState.scrollX) / appState.zoom;
            const cy = (window.innerHeight / 2 - appState.scrollY) / appState.zoom;
            const maxW = Math.min(600, window.innerWidth * 0.5);
            const maxH = Math.min(400, window.innerHeight * 0.5);
            const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
            const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
            const el: any = {
              id: nanoid(), type: 'image',
              x: cx - w / 2, y: cy - h / 2,
              width: w, height: h, angle: 0,
              strokeColor: 'transparent', backgroundColor: 'transparent',
              strokeWidth: 0, strokeStyle: 'solid', roughness: 0,
              opacity: 1, isDeleted: false,
              seed: Math.floor(Math.random() * 2 ** 31),
              fileId: src,
            };
            state.setAppState({ selectedElementIds: [el.id], activeTool: 'select' });
            state.addElement(el);
            state.addHistoryPoint();
          };
          img.src = src;
        };
        reader.readAsDataURL(file);
      } else {
        const text = await file.text();
        try {
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
             useElementsStore.setState({ elements: data, dirty: true });
             return;
          }
        } catch (err) {
          // not JSON array, treat as text file
        }
        
        // Treat as text file
        const state = useElementsStore.getState();
        const { appState } = state;
        const cx = (window.innerWidth / 2 - appState.scrollX) / appState.zoom;
        const cy = (window.innerHeight / 2 - appState.scrollY) / appState.zoom;
        
        const el: any = {
          id: nanoid(), type: 'text',
          x: cx - 100, y: cy - 14, width: 200, height: 28, angle: 0,
          strokeColor: appState.currentItemStyle.strokeColor === 'transparent' ? '#1e1e1e' : appState.currentItemStyle.strokeColor,
          backgroundColor: 'transparent',
          strokeWidth: 1, strokeStyle: 'solid',
          roughness: 0, opacity: 1, isDeleted: false,
          seed: Math.floor(Math.random() * 2 ** 31),
          text: text.slice(0, 2000), // truncate if too large
          fontSize: appState.currentItemStyle.fontSize, 
          fontFamily: appState.currentItemStyle.fontFamily,
          textAlign: appState.currentItemStyle.textAlign,
        };
        state.addElement(el);
        state.setAppState({ selectedElementIds: [el.id], activeTool: 'select' });
        state.addHistoryPoint();
      }
    };
    input.click();
    onClose();
  };

  const handleSave = () => {
    const data = useElementsStore.getState().elements;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xcalidraw-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleExportImage = () => {
    const mainCanvas = document.querySelector('canvas');
    if (mainCanvas) {
       const url = mainCanvas.toDataURL('image/png');
       const a = document.createElement('a');
       a.href = url;
       a.download = `xcalidraw-export-${new Date().toISOString().slice(0,10)}.png`;
       a.click();
    }
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear the canvas?')) {
      useElementsStore.setState({ elements: [], dirty: true });
      useElementsStore.getState().addHistoryPoint();
    }
    onClose();
  };

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    setDirty();
  };
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyO') {
        e.preventDefault();
        handleOpen();
      }
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyE') {
        e.preventDefault();
        handleExportImage();
      }
      if (e.altKey && e.shiftKey && e.code === 'KeyR') {
        e.preventDefault();
        handleReset();
      }
      if (e.altKey && e.shiftKey && e.code === 'KeyD') {
        e.preventDefault();
        const currentTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        setTheme(currentTheme);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  return (
    <>
      <div 
        ref={panelRef}
        className={`fixed top-0 left-0 h-full w-[280px] bg-ui-bg border-r border-ui-border shadow-xl z-50 flex flex-col transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } overflow-y-auto`}
      >
        <div className="p-4 flex flex-col gap-1">
          {/* Section 1 */}
          <SectionItem icon={FolderOpen} label="Open" onClick={handleOpen} />
          <SectionItem icon={Save} label="Save to..." onClick={handleSave} />
          <SectionItem icon={Download} label="Export image..." onClick={handleExportImage} />
          <div className="h-px w-full bg-ui-border my-2"></div>
          <SectionItem icon={Search} label="Find" onClick={() => {
            useElementsStore.getState().setAppState({ isFindOpen: true });
            onClose();
          }} />
          <SectionItem icon={HelpCircle} label="Help" onClick={() => {
            useElementsStore.getState().setAppState({ isHelpOpen: true });
            onClose();
          }} />
          <div className="h-px w-full bg-ui-border my-2"></div>
          <SectionItem icon={RotateCcw} label="Reset the canvas" onClick={handleReset} />
        </div>

        <div className="h-2 w-full bg-ui-bg-hover border-y border-ui-border/50"></div>

        <div className="p-4 flex flex-col gap-1">
          {/* Section 2 */}
          <SectionItem icon={GitFork} label="GitHub" onClick={() => window.open('https://github.com/0xJoy07/Xcalidraw', '_blank')} />
        </div>

        <div className="h-2 w-full bg-ui-bg-hover border-y border-ui-border/50"></div>

        <div className="p-4">
          {/* Section 3 */}
          <button 
            className="flex items-center justify-between w-full text-sm font-semibold text-ui-fg mb-4 group"
            onClick={() => setPreferencesOpen(!preferencesOpen)}
          >
            <span>Preferences</span>
            {preferencesOpen ? <ChevronUp size={16} className="text-ui-fg-muted" /> : <ChevronDown size={16} className="text-ui-fg-muted" />}
          </button>
          
          {preferencesOpen && (
            <div className="flex flex-col gap-5">
              
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-ui-fg-muted uppercase tracking-wider">Theme</span>
                <div className="flex bg-ui-bg-hover p-1 rounded-lg border border-ui-border">
                  <button onClick={() => setTheme('dark')} className="flex-1 flex justify-center py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-ui-fg">
                    <Moon size={16} />
                  </button>
                  <button onClick={() => setTheme('light')} className="flex-1 flex justify-center py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-ui-fg">
                    <Sun size={16} />
                  </button>
                  <button onClick={() => setTheme('system')} className="flex-1 flex justify-center py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-ui-fg">
                    <Monitor size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-ui-fg-muted uppercase tracking-wider">Canvas Background</span>
                <div className="flex gap-2 flex-wrap">
                  {BG_COLORS.map(color => (
                    <button
                      key={color}
                      className="w-7 h-7 rounded-md border border-ui-border transition-transform hover:scale-110"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        document.documentElement.style.setProperty('--canvas-bg', color);
                        setDirty();
                      }}
                    />
                  ))}
                </div>
              </div>



            </div>
          )}
        </div>
      </div>
    </>
  );
};
