import React from 'react';
import { PageLinks } from './PageLinks';

interface DocPageProps {
  title: string;
  description: string;
  children: React.ReactNode;
  relatedPages?: { label: string; to: string }[];
}

export const DocPage = ({ title, description, children, relatedPages }: DocPageProps) => {
  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in duration-500">
      <header className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          {title}
        </h1>
        <p className="text-xl text-white/60 leading-relaxed">
          {description}
        </p>
      </header>
      
      <div className="prose prose-invert prose-p:text-white prose-headings:text-white prose-strong:text-white prose-li:text-white prose-headings:font-bold prose-a:text-white max-w-none space-y-8">
        {children}
      </div>

      {relatedPages && relatedPages.length > 0 && (
        <PageLinks links={relatedPages} />
      )}
    </div>
  );
};
