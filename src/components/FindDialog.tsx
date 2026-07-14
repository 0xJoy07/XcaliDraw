import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useElementsStore } from '../store/elementsStore';

export const FindDialog = () => {
  const isFindOpen = useElementsStore(state => state.appState.isFindOpen);
  const setAppState = useElementsStore(state => state.setAppState);
  const elements = useElementsStore(state => state.elements);
  
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFindOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setMatches([]);
    }
  }, [isFindOpen]);

  // Global shortcut to open Find (Ctrl+F / Cmd+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setAppState({ isFindOpen: true });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setAppState]);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setMatches([]);
      setCurrentIndex(0);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const found = elements
      .filter(el => !el.isDeleted && el.type === 'text' && el.text?.toLowerCase().includes(lowerQuery))
      .map(el => el.id);
    
    setMatches(found);
    setCurrentIndex(0);
    
    if (found.length > 0) {
      navigateTo(found[0]);
    }
  }, [query, elements]);

  const navigateTo = (id: string) => {
    const el = useElementsStore.getState().elements.find(e => e.id === id);
    if (!el) return;
    const state = useElementsStore.getState();
    const zoom = state.appState.zoom;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const elCx = el.x + el.width / 2;
    const elCy = el.y + el.height / 2;
    
    state.setAppState({
      scrollX: cx - elCx * zoom,
      scrollY: cy - elCy * zoom,
      selectedElementIds: [id],
    });
  };

  const stepFind = (dir: 1 | -1) => {
    if (matches.length === 0) return;
    const next = (currentIndex + dir + matches.length) % matches.length;
    setCurrentIndex(next);
    navigateTo(matches[next]);
  };

  const closeFind = () => {
    setAppState({ isFindOpen: false });
  };

  if (!isFindOpen) return null;

  return (
    <div className="absolute top-4 right-4 z-50 flex items-center bg-ui-bg border border-ui-border rounded-xl shadow-lg p-2 pr-1 gap-2 transition-all">
      <Search size={16} className="text-ui-fg-muted ml-2" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Find text..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            stepFind(e.shiftKey ? -1 : 1);
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            closeFind();
          }
        }}
        className="bg-transparent border-none outline-none text-sm text-ui-fg placeholder:text-ui-fg-muted w-48 mx-2"
      />
      {query && (
        <span className="text-xs text-ui-fg-muted min-w-[30px] text-center">
          {matches.length > 0 ? `${currentIndex + 1}/${matches.length}` : '0'}
        </span>
      )}
      
      <div className="flex items-center gap-1 border-l border-ui-border pl-2 ml-1">
        <button 
          onClick={() => stepFind(-1)}
          disabled={matches.length === 0}
          className="p-1 rounded hover:bg-ui-bg-hover text-ui-fg disabled:opacity-30 transition-colors"
          title="Previous match (Shift+Enter)"
        >
          <ChevronUp size={18} />
        </button>
        <button 
          onClick={() => stepFind(1)}
          disabled={matches.length === 0}
          className="p-1 rounded hover:bg-ui-bg-hover text-ui-fg disabled:opacity-30 transition-colors"
          title="Next match (Enter)"
        >
          <ChevronDown size={18} />
        </button>
        <div className="w-px h-4 bg-ui-border mx-1"></div>
        <button 
          onClick={closeFind}
          className="p-1 rounded hover:bg-ui-bg-hover text-ui-fg transition-colors mr-1"
          title="Close (Esc)"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
