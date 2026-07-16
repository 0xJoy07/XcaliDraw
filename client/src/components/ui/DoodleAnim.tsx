import { useEffect, useState } from 'react';

export const DoodleAnim = () => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Small delay to ensure the animation triggers after mount and CSS is ready
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex justify-center mb-6">
      <svg
        width="48"
        height="48"
        viewBox="0 0 100 100"
        className="text-ink"
        style={{
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: 'none',
          strokeWidth: 5,
          stroke: 'currentColor'
        }}
      >
        <style>
          {`
            .draw-path-face {
              stroke-dasharray: 300;
              stroke-dashoffset: ${mounted ? '0' : '300'};
              transition: stroke-dashoffset 1s ease-out;
            }
            .draw-path-eyes {
              stroke-dasharray: 20;
              stroke-dashoffset: ${mounted ? '0' : '20'};
              transition: stroke-dashoffset 0.3s ease-out 0.8s;
            }
            .draw-path-smile {
              stroke-dasharray: 100;
              stroke-dashoffset: ${mounted ? '0' : '100'};
              transition: stroke-dashoffset 0.6s ease-out 1s;
            }
            @media (prefers-reduced-motion: reduce) {
              .draw-path-face, .draw-path-eyes, .draw-path-smile {
                transition: none !important;
                stroke-dashoffset: 0 !important;
              }
            }
          `}
        </style>
        {/* Face Outline (rough circle) */}
        <path className="draw-path-face" d="M 50 10 C 20 10, 10 30, 10 50 C 10 80, 30 90, 50 90 C 80 90, 90 70, 90 50 C 90 20, 70 10, 50 10 Z" />
        {/* Eyes */}
        <path className="draw-path-eyes" d="M 35 40 L 35 45" strokeWidth="8" />
        <path className="draw-path-eyes" d="M 65 40 L 65 45" strokeWidth="8" />
        {/* Smile */}
        <path className="draw-path-smile" d="M 30 65 Q 50 85, 70 65" />
      </svg>
    </div>
  );
};
