
import { Book, Layers, Code, PenTool, Database, GitPullRequest, MapIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DocsIndex = () => {
  const cards = [
    { title: 'Getting Started', icon: Book, desc: 'Installation and setup guide.', to: 'getting-started/installation' },
    { title: 'Architecture', icon: Layers, desc: 'High-level system design.', to: 'architecture/overview' },
    { title: 'Core Systems', icon: Code, desc: 'Selection, editing, and laser tool.', to: 'core-systems/selection' },
    { title: 'Components', icon: PenTool, desc: 'Canvas, Sidebar, Toolbar.', to: 'components/canvas-root' },
    { title: 'Data Model', icon: Database, desc: 'State schema and elements.', to: 'data-model/element-schema' },
    { title: 'Contributing', icon: GitPullRequest, desc: 'How to add new tools/elements.', to: 'contributing/code-style' },
    { title: 'Roadmap', icon: MapIcon, desc: 'Future features and known gaps.', to: 'roadmap' }
  ];

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-4">
          Developer Documentation
        </h1>
        <p className="text-xl text-gray-400">
          Welcome to the Xcalidraw internals guide. This documentation covers the architecture, state management, and rendering pipelines of this single-user, canvas-based drawing application.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card, i) => (
          <Link 
            key={i} 
            to={card.to}
            className="flex items-start gap-4 p-6 rounded-2xl border border-white/10 hover:border-gray-500 hover:shadow-md bg-black transition-all group"
          >
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-white group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
              <card.icon size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white mb-1">{card.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
