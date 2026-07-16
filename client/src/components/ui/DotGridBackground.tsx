import { useEffect, useState } from 'react';

export const DotGridBackground = ({ children, className = "flex items-center justify-center px-4 py-8" }: { children: React.ReactNode, className?: string }) => {
  const [bgUrl, setBgUrl] = useState('');

  useEffect(() => {
    const generateBg = () => {
      const canvas = document.createElement('canvas');
      const step = 20; // Exact step from Canvas.tsx
      canvas.width = step;
      canvas.height = step;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';

      ctx.beginPath();
      // Draw at the exact center (1,1) of our tile to match Canvas.tsx pattern offset behavior
      ctx.arc(1, 1, 1, 0, Math.PI * 2);
      ctx.fill();

      setBgUrl(canvas.toDataURL());
    };

    generateBg();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          generateBg();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`min-h-[100dvh] w-full bg-paper text-ink ${className}`}
      style={{ backgroundImage: `url(${bgUrl})` }}
    >
      {children}
    </div>
  );
};
