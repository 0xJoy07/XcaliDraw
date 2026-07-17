import { Cloud, RefreshCw, AlertCircle } from 'lucide-react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

export const SaveStatusBadge = ({ status }: { status: SaveStatus }) => {
  if (status === 'idle') {
    return (
      <div className="flex h-[44px] items-center justify-center gap-1.5 rounded-lg bg-marker-mint-bg px-3 text-sm font-semibold text-marker-mint-text shadow-sm transition-colors w-max select-none">
        <Cloud size={16} strokeWidth={2.5} />
        <span>Autosaved</span>
      </div>
    );
  }

  return (
    <div className={`flex h-[44px] items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold shadow-sm transition-colors w-max select-none ${
      status === 'saving' ? 'bg-marker-yellow-bg text-marker-yellow-text' :
      status === 'saved' ? 'bg-marker-mint-bg text-marker-mint-text' :
      'bg-marker-red-bg text-marker-red-text'
    }`}>
      {status === 'saving' && (
        <>
          <RefreshCw size={16} strokeWidth={2.5} className="motion-safe:animate-spin motion-reduce:animate-none" />
          <span>Saving...</span>
        </>
      )}
      
      {status === 'saved' && (
        <>
          <Cloud size={16} strokeWidth={2.5} />
          <span>Autosaved</span>
        </>
      )}
      
      {status === 'failed' && (
        <>
          <AlertCircle size={16} strokeWidth={2.5} />
          <span>Save failed</span>
        </>
      )}
    </div>
  );
};
