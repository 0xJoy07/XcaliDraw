import { useElementsStore } from '../store/elementsStore';
import { X, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Toasts = () => {
  const toasts = useElementsStore((state) => state.toasts);
  const removeToast = useElementsStore((state) => state.removeToast);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none items-end">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';
          const Icon = isError ? AlertTriangle : isSuccess ? CheckCircle2 : Info;
          
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: 'easeOut' } }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`
                pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border
                ${isError 
                  ? 'bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                  : isSuccess
                    ? 'bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
                    : 'bg-white dark:bg-[#25262b] border-ui-border text-ui-fg'
                }
              `}
            >
              <Icon size={18} className={isError ? 'text-red-500' : isSuccess ? 'text-green-500' : 'text-indigo-500'} />
              <span className="text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className={`ml-2 p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity ${
                  isError ? 'hover:bg-red-100 dark:hover:bg-red-900/50' : isSuccess ? 'hover:bg-green-100 dark:hover:bg-green-900/50' : 'hover:bg-ui-bg-hover'
                }`}
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
