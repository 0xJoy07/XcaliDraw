import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useElementsStore } from '../store/elementsStore';

export const HelpDialog = () => {
  const isHelpOpen = useElementsStore(state => state.appState.isHelpOpen);
  const setAppState = useElementsStore(state => state.setAppState);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        
        e.preventDefault();
        setAppState({ isHelpOpen: !useElementsStore.getState().appState.isHelpOpen });
      }
      
      if (e.key === 'Escape' && useElementsStore.getState().appState.isHelpOpen) {
        setAppState({ isHelpOpen: false });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setAppState]);

  if (!isHelpOpen) return null;

  const ShortcutRow = ({ label, keys }: { label: string, keys: string[] }) => (
    <div className="flex justify-between items-center py-2 border-b border-ui-border/50 last:border-0">
      <span className="text-sm text-ui-fg">{label}</span>
      <div className="flex gap-1 items-center">
        {keys.map((k, i) => (
          k === '/' ? (
            <span key={i} className="text-sm font-medium text-ui-fg-muted px-1">/</span>
          ) : (
            <kbd key={i} className="px-2 py-1 bg-ui-bg-hover border border-ui-border rounded-md text-xs font-mono text-ui-fg-muted font-semibold min-w-[24px] text-center shadow-sm">
              {k}
            </kbd>
          )
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div 
        className="bg-ui-bg rounded-2xl shadow-2xl border border-ui-border w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-ui-border">
          <h2 className="text-xl font-bold text-ui-fg">Keyboard Shortcuts</h2>
          <button 
            onClick={() => setAppState({ isHelpOpen: false })}
            className="p-2 rounded-lg hover:bg-ui-bg-hover text-ui-fg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          
          <div>
            <h3 className="text-sm font-bold text-ui-fg-muted uppercase tracking-wider mb-4">Tools</h3>
            <ShortcutRow label="Selection" keys={['1', '/', 'V']} />
            <ShortcutRow label="Rectangle" keys={['2', '/', 'R']} />
            <ShortcutRow label="Diamond" keys={['3', '/', 'D']} />
            <ShortcutRow label="Ellipse" keys={['4', '/', 'E']} />
            <ShortcutRow label="Arrow" keys={['5', '/', 'A']} />
            <ShortcutRow label="Line" keys={['6', '/', 'L']} />
            <ShortcutRow label="Draw" keys={['7', '/', 'P']} />
            <ShortcutRow label="Text" keys={['8', '/', 'T']} />
            <ShortcutRow label="Image" keys={['9']} />
            <ShortcutRow label="Eraser" keys={['0']} />
            <ShortcutRow label="Laser Pointer" keys={['K']} />
            <ShortcutRow label="Hand (Pan)" keys={['H']} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-ui-fg-muted uppercase tracking-wider mb-4">Actions</h3>
            <ShortcutRow label="Undo" keys={['Ctrl', 'Z']} />
            <ShortcutRow label="Redo" keys={['Ctrl', 'Y']} />
            <ShortcutRow label="Delete" keys={['Del', 'Backspace']} />
            <ShortcutRow label="Find" keys={['Ctrl', 'F']} />
            <ShortcutRow label="Open File" keys={['Ctrl', 'O']} />
            <ShortcutRow label="Save File" keys={['Ctrl', 'S']} />
            <ShortcutRow label="Export Image" keys={['Ctrl', 'Shift', 'E']} />
            <ShortcutRow label="Toggle Theme" keys={['Alt', 'Shift', 'D']} />
            <ShortcutRow label="Reset Canvas" keys={['Alt', 'Shift', 'R']} />
            <ShortcutRow label="Help" keys={['?']} />
          </div>

        </div>
      </div>
    </div>
  );
};
