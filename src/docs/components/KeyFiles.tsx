import { FileCode } from 'lucide-react';

export const KeyFiles = ({ files }: { files: string[] }) => {
  return (
    <div className="my-6 bg-black dark:bg-[#1e1e1e]/50 rounded-xl border border-white/10 p-4">
      <h4 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
        <FileCode size={16} />
        Key Files
      </h4>
      <ul className="space-y-1.5">
        {files.map((file, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-ui-border"></span>
            <code className="bg-slate-200/50 dark:bg-[#2d2d2d]/50 px-1.5 py-0.5 rounded text-xs text-white font-mono">
              {file}
            </code>
          </li>
        ))}
      </ul>
    </div>
  );
};
