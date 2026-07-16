import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import type { InputHTMLAttributes } from 'react';

export const RoughInput = (props: InputHTMLAttributes<HTMLInputElement>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isFocused, setIsFocused] = useState(false);

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
      stroke: isFocused ? 'var(--marker-violet)' : 'var(--ink)',
      strokeWidth: isFocused ? 2.5 : 1.5,
      roughness: 1.2,
      fill: 'var(--paper)',
      fillStyle: 'solid',
    });
    svg.appendChild(node);
  }, [dimensions, isFocused]);

  return (
    <div ref={containerRef} className="relative w-full h-11 mt-1">
      <svg
        ref={svgRef}
        className="absolute inset-0 pointer-events-none"
        width="100%"
        height="100%"
        style={{ overflow: 'visible' }}
      />
      <input
        {...props}
        className={`relative z-10 w-full h-full bg-transparent px-3 outline-none text-ink font-sans placeholder-ui-fg-muted ${props.className || ''}`}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
      />
    </div>
  );
};
