import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';

export const RoughCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateDims = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    const observer = new ResizeObserver(updateDims);
    observer.observe(containerRef.current);
    
    // Ensure accurate layout after fonts load (especially Excalifont)
    document.fonts.ready.then(updateDims);
    
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
      stroke: 'var(--ink)',
      strokeWidth: 2,
      roughness: 1.5,
      fill: 'var(--paper)',
      fillStyle: 'solid',
    });
    svg.appendChild(node);
  }, [dimensions]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <svg
        ref={svgRef}
        className="absolute inset-0 pointer-events-none"
        width="100%"
        height="100%"
        style={{ overflow: 'visible' }}
      />
      <div className="relative z-10 p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
};
