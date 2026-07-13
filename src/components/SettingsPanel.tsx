import { useEffect, useRef, useState } from 'react';
import { 
  FolderOpen, Save, Download, Terminal, Search, HelpCircle, RotateCcw,
  GitFork, X as XIcon, MessageSquare, UserPlus, ChevronDown, ChevronUp,
  Moon, Sun, Monitor
} from 'lucide-react';
import { useElementsStore } from '../store/elementsStore';

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

  const SectionItem = ({ icon: Icon, label }: { icon: any, label: string }) => (
    <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-ui-fg hover:bg-ui-bg-hover rounded-lg transition-colors">
      <Icon size={16} className="text-ui-fg-muted" />
      <span className="font-medium">{label}</span>
    </button>
  );

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
          <SectionItem icon={FolderOpen} label="Open" />
          <SectionItem icon={Save} label="Save to..." />
          <SectionItem icon={Download} label="Export image..." />
          <div className="h-px w-full bg-ui-border my-2"></div>
          <SectionItem icon={Terminal} label="Command palette" />
          <SectionItem icon={Search} label="Find" />
          <SectionItem icon={HelpCircle} label="Help" />
          <div className="h-px w-full bg-ui-border my-2"></div>
          <SectionItem icon={RotateCcw} label="Reset the canvas" />
        </div>

        <div className="h-2 w-full bg-ui-bg-hover border-y border-ui-border/50"></div>

        <div className="p-4 flex flex-col gap-1">
          {/* Section 2 */}
          <SectionItem icon={GitFork} label="GitHub" />
          <SectionItem icon={XIcon} label="X" />
          <SectionItem icon={MessageSquare} label="Discord" />
          <div className="h-px w-full bg-ui-border my-2"></div>
          <SectionItem icon={UserPlus} label="Sign up" />
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
                  <button className="flex-1 flex justify-center py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-ui-fg">
                    <Moon size={16} />
                  </button>
                  <button className="flex-1 flex justify-center py-1.5 rounded-md bg-ui-bg shadow-sm border border-ui-border text-indigo-500">
                    <Sun size={16} />
                  </button>
                  <button className="flex-1 flex justify-center py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-ui-fg">
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

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-ui-fg-muted uppercase tracking-wider">Language</span>
                <select className="w-full bg-ui-bg border border-ui-border text-ui-fg text-sm rounded-md px-3 py-2 focus:outline-none focus:border-indigo-500">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
};
