import { Code2 } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';

export const CodeSnippet = ({ code, language = 'tsx', title }: { code: string, language?: string, title?: string }) => {
  // Use a dark theme for code snippet background
  const theme = themes.vsDark;
  
  return (
    <div className="my-6 rounded-xl overflow-hidden border border-white/10 bg-[#1e1e1e] shadow-sm">
      {title && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2d] border-b border-[#3d3d3d] text-gray-300 text-xs font-mono">
          <Code2 size={14} />
          {title}
        </div>
      )}
      <div className="p-4 overflow-x-auto text-sm font-mono text-gray-100 leading-relaxed">
        <Highlight theme={theme} code={code.trim()} language={language as any}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={className} style={{ ...style, backgroundColor: 'transparent' }}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
};
