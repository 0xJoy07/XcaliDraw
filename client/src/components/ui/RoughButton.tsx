import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import type { ButtonHTMLAttributes } from 'react';

interface RoughButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
}

export const RoughButton = ({ variant = 'primary', icon, children, ...props }: RoughButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isHovered, setIsHovered] = useState(false);

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
    
    // Keep only the underline path if it exists, remove rough elements
    const pathsToKeep = Array.from(svg.querySelectorAll('.hover-underline'));
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
    pathsToKeep.forEach(p => svg.appendChild(p));

    const rc = rough.svg(svg);
    if (variant === 'primary') {
      // Highlighter swipe effect
      const node = rc.line(4, dimensions.height / 2, dimensions.width - 4, dimensions.height / 2, {
        stroke: 'var(--marker-yellow)',
        strokeWidth: dimensions.height - 12,
        roughness: 2,
        bowing: 1,
      });
      // Insert before the underline so underline is on top
      svg.insertBefore(node, svg.firstChild);
    } else {
      // Wobbly border for secondary
      const node = rc.rectangle(2, 2, dimensions.width - 4, dimensions.height - 4, {
        stroke: 'var(--ink)',
        strokeWidth: 1.5,
        roughness: 1.2,
        fill: 'var(--paper)',
        fillStyle: 'solid',
      });
      svg.insertBefore(node, svg.firstChild);
    }
  }, [dimensions, variant]);

  // If contrast of ink on yellow fails, we can dynamically darken here, but #1E293B on #FFD93D is 8:1 (AAA)
  const textColor = variant === 'primary' ? 'text-[#151c28]' : 'text-ink'; // Slightly darkened ink just in case

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-h-[44px] ${props.className || ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        ref={svgRef}
        className="absolute inset-0 pointer-events-none"
        width="100%"
        height="100%"
        style={{ overflow: 'visible' }}
      >
        <path
          className="hover-underline"
          d={`M ${dimensions.width * 0.2} ${dimensions.height - 6} Q ${dimensions.width * 0.5} ${dimensions.height - 2} ${dimensions.width * 0.8} ${dimensions.height - 8}`}
          stroke="var(--ink)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="100"
          strokeDashoffset={isHovered ? "0" : "100"}
          style={{
            transition: 'stroke-dashoffset 0.2s ease-out',
          }}
        />
      </svg>
      <button
        {...props}
        className={`relative z-10 w-full h-full flex items-center justify-center gap-2 px-3 py-2 font-virgil text-lg disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-marker-violet rounded-md ${textColor}`}
      >
        {icon && <span className="flex items-center justify-center">{icon}</span>}
        {children}
      </button>
    </div>
  );
};
