import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';

export const RoughLink = (props: LinkProps) => {
  const containerRef = useRef<HTMLAnchorElement>(null);
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

  return (
    <Link
      {...props}
      ref={containerRef}
      className={`relative inline-block ${props.className || ''}`}
      onMouseEnter={(e) => {
        setIsHovered(true);
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        props.onMouseLeave?.(e);
      }}
      // Remove default underline behavior since we're using SVG
      style={{ textDecoration: 'none', ...props.style }}
    >
      <span className="relative z-10 transition-colors duration-200" style={{ color: isHovered ? 'var(--marker-violet)' : 'inherit' }}>
        {props.children}
      </span>
      {dimensions.width > 0 && (
        <svg
          className="absolute left-0 pointer-events-none"
          style={{ top: '100%', overflow: 'visible', marginTop: '-2px' }}
          width={dimensions.width}
          height="12"
        >
          <path
            d={`M 0 4 Q ${dimensions.width * 0.5} 0 ${dimensions.width} 6`}
            stroke="var(--marker-violet)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={isHovered ? "0" : "100"}
            style={{
              transition: 'stroke-dashoffset 0.2s ease-out',
            }}
          />
        </svg>
      )}
    </Link>
  );
};
