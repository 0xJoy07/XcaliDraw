import { AlertTriangle, Lightbulb } from 'lucide-react';

export const Gotchas = ({ children, title, type = 'warning' }: { children: React.ReactNode, title?: string, type?: 'warning' | 'error' | 'info' }) => {
  const isWarning = type === 'warning';
  const isError = type === 'error';
  
  const getStyle = () => {
    if (isWarning) return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-200';
    if (isError) return 'bg-red-500/10 border-red-500/50 text-red-200';
    return 'bg-black/50 border-white/20 text-white'; // Fallback for info
  };

  const getTitle = () => {
    if (title) return title;
    if (isWarning) return 'Gotchas & Edge Cases';
    if (isError) return 'Error / Breaking Change';
    return 'Note';
  };
  
  return (
    <div className={`my-8 p-5 rounded-xl border ${getStyle()}`}>
      <h4 className="flex items-center gap-2 font-bold mb-2 text-white">
        {isWarning ? <AlertTriangle size={18} className="text-yellow-400" /> : isError ? <AlertTriangle size={18} className="text-red-400" /> : <Lightbulb size={18} className="text-white" />}
        {getTitle()}
      </h4>
      <div className="text-sm opacity-90 space-y-2 text-white/80">
        {children}
      </div>
    </div>
  );
};
