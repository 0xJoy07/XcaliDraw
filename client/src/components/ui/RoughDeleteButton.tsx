import { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

export const RoughDeleteButton = (props: ButtonHTMLAttributes<HTMLButtonElement>) => {
  const containerRef = useRef<HTMLButtonElement>(null);
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
    <button
      {...props}
      ref={containerRef}
      className={`relative inline-flex items-center justify-center rounded-md p-2 text-ui-fg-muted hover:text-red-500 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-marker-violet ${props.className || ''}`}
      onMouseEnter={(e) => {
        setIsHovered(true);
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        props.onMouseLeave?.(e);
      }}
      aria-label={props['aria-label'] || 'Delete canvas'}
      title={props.title || 'Delete canvas'}
    >
      <Trash2 size={16} className="relative z-10" />
      {dimensions.width > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ overflow: 'visible' }}
          width={dimensions.width}
          height={dimensions.height}
        >
          <path
            d={`M ${dimensions.width * 0.25} ${dimensions.height * 0.25} Q ${dimensions.width * 0.5} ${dimensions.height * 0.5} ${dimensions.width * 0.75} ${dimensions.height * 0.75} M ${dimensions.width * 0.75} ${dimensions.height * 0.25} Q ${dimensions.width * 0.5} ${dimensions.height * 0.5} ${dimensions.width * 0.25} ${dimensions.height * 0.75}`}
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={isHovered ? "0" : "100"}
            className="delete-scribble"
          />
          <style>
            {`
              .delete-scribble {
                transition: stroke-dashoffset 0.15s ease-out;
              }
              @media (prefers-reduced-motion: reduce) {
                .delete-scribble {
                  transition: none !important;
                }
              }
            `}
          </style>
        </svg>
      )}
    </button>
  );
};
