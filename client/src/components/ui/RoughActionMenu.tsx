import React, { useEffect, useRef, useState, useId } from 'react';
import rough from 'roughjs';
import { MoreVertical } from 'lucide-react';

interface ActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}

interface RoughActionMenuProps {
  actions: ActionItem[];
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export const RoughActionMenu = ({ actions, disabled, className = '', ariaLabel = 'Actions' }: RoughActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const id = useId();
  const menuId = `menu-${id}`;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;
    const svg = svgRef.current;
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
    // Only draw the rough box if focused or open
    if (isFocused || isOpen) {
      const rc = rough.svg(svg);
      const node = rc.rectangle(2, 2, dimensions.width - 4, dimensions.height - 4, {
        stroke: 'var(--marker-violet)',
        strokeWidth: 2,
        roughness: 1.5,
        fill: 'var(--paper)',
        fillStyle: 'solid',
      });
      svg.appendChild(node);
    }
  }, [dimensions, isFocused, isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0) {
        actions[highlightedIndex].onClick();
        setIsOpen(false);
      } else {
        setIsOpen(!isOpen);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex(prev => (prev < actions.length - 1 ? prev + 1 : prev));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(actions.length - 1);
      } else {
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
      }
    } else if (e.key === 'Tab') {
      if (isOpen) setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  return (
    <div 
      className={`relative inline-block ${className}`}
      ref={containerRef}
      onClick={(e) => e.stopPropagation()} // Prevent card click
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-disabled={disabled}
        aria-label={ariaLabel}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`relative flex items-center justify-center p-2 rounded-md outline-none cursor-pointer z-10 transition-colors hover:text-marker-violet hover:bg-black/5 dark:hover:bg-white/5 ${disabled ? 'opacity-50 cursor-not-allowed' : 'text-ui-fg-muted'}`}
      >
        <svg
          ref={svgRef}
          className="absolute inset-0 pointer-events-none"
          width="100%"
          height="100%"
          style={{ overflow: 'visible' }}
        />
        <MoreVertical size={20} className="relative z-10" />
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          id={menuId}
          role="menu"
          className="absolute right-0 top-full mt-1 z-50 min-w-[160px] bg-paper text-ink border-2 border-ink rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 ease-out origin-top-right motion-reduce:animate-none motion-reduce:transition-none"
        >
          {actions.map((action, index) => {
            const isHighlighted = index === highlightedIndex;
            return (
              <div
                key={action.label}
                role="menuitem"
                tabIndex={-1}
                id={`${menuId}-item-${index}`}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-sans cursor-pointer transition-colors ${
                  isHighlighted ? 'bg-black/5 dark:bg-white/5' : ''
                } ${action.destructive ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30' : ''}`}
              >
                {action.icon}
                <span>{action.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
