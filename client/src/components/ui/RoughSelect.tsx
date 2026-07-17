import React, { useEffect, useRef, useState, useId } from 'react';
import rough from 'roughjs';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface RoughSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
  className?: string;
}

export const RoughSelect = ({ value, onChange, options, disabled, className = '' }: RoughSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const id = useId();
  const listboxId = `listbox-${id}`;

  const selectedOption = options.find(o => o.value === value) || options[0];

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
    const rc = rough.svg(svg);
    const node = rc.rectangle(2, 2, dimensions.width - 4, dimensions.height - 4, {
      stroke: isFocused || isOpen ? 'var(--marker-violet)' : 'var(--ink)',
      strokeWidth: isFocused || isOpen ? 2.5 : 1.5,
      roughness: 1.2,
      fill: 'var(--paper)',
      fillStyle: 'solid',
    });
    svg.appendChild(node);
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
        onChange(options[highlightedIndex].value);
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(options.findIndex(o => o.value === value));
      } else {
        setHighlightedIndex(prev => (prev < options.length - 1 ? prev + 1 : prev));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(options.findIndex(o => o.value === value));
      } else {
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
      }
    } else if (e.key === 'Tab') {
      if (isOpen) setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex(o => o.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, value, options]);

  return (
    <div 
      className={`relative w-full ${className}`}
      ref={containerRef}
    >
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`relative w-full h-11 mt-1 outline-none cursor-pointer flex items-center justify-between px-3 z-10 transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <svg
          ref={svgRef}
          className="absolute inset-0 pointer-events-none"
          width="100%"
          height="100%"
          style={{ overflow: 'visible' }}
        />
        
        <span className="relative z-10 text-ink font-sans text-sm truncate">
          {selectedOption.label}
        </span>
        
        <ChevronDown 
          size={16} 
          className={`relative z-10 text-ink transition-transform duration-200 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>

      {isOpen && (
        <div 
          ref={dropdownRef}
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 z-50 bg-paper text-ink border-2 border-ink rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 ease-out origin-top"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;
            
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isSelected}
                id={`${listboxId}-option-${index}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`px-3 py-2 text-sm font-sans cursor-pointer transition-colors ${
                  isHighlighted ? 'bg-marker-violet/20' : ''
                } ${isSelected ? 'font-medium' : ''}`}
              >
                {option.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
