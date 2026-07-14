import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const PageLinks = ({ links }: { links: { label: string; to: string }[] }) => {
  return (
    <div className="pt-10 mt-10 border-t border-white/10">
      <h3 className="text-sm font-semibold text-white mb-4">Related Topics</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {links.map((link, i) => (
          <Link 
            key={i} 
            to={`/docs/${link.to}`}
            className="group flex items-center justify-between p-4 rounded-xl border border-white/10 hover:border-indigo-500 hover:shadow-sm bg-black transition-all"
          >
            <span className="font-medium text-white group-hover:text-white">
              {link.label}
            </span>
            <ArrowRight size={18} className="text-gray-400 group-hover:text-white transform group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  );
};
