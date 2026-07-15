const fs = require('fs');
let code = fs.readFileSync('generate_docs.js', 'utf8');

// Update colors
code = code.replace(/bg-slate-50 dark:bg-slate-950/g, 'bg-canvas-bg');
code = code.replace(/bg-slate-50/g, 'bg-ui-bg');
code = code.replace(/text-slate-900 dark:text-slate-100/g, 'text-ui-fg');
code = code.replace(/bg-white dark:bg-slate-900/g, 'bg-ui-bg');
code = code.replace(/border-slate-200 dark:border-slate-800/g, 'border-ui-border');
code = code.replace(/bg-slate-100\/50 dark:bg-slate-900\/50/g, 'bg-ui-bg-hover');
code = code.replace(/text-slate-600 dark:text-slate-400/g, 'text-ui-fg-muted');
code = code.replace(/bg-slate-100 dark:bg-slate-800\/50/g, 'bg-ui-bg-hover');
code = code.replace(/bg-slate-100 dark:bg-slate-800/g, 'bg-ui-bg-hover');
code = code.replace(/text-slate-900 dark:text-slate-200/g, 'text-ui-fg');
code = code.replace(/text-slate-500 dark:text-slate-400/g, 'text-ui-fg-muted');
code = code.replace(/bg-white dark:bg-slate-950/g, 'bg-ui-bg');
code = code.replace(/text-slate-900 dark:text-white/g, 'text-ui-fg');
code = code.replace(/text-slate-700 dark:text-slate-300/g, 'text-ui-fg');
code = code.replace(/text-slate-400/g, 'text-ui-fg-muted');

// Update prose colors
code = code.replace(/prose prose-slate dark:prose-invert/g, 'prose dark:prose-invert prose-p:text-ui-fg prose-headings:text-ui-fg prose-strong:text-ui-fg prose-li:text-ui-fg');

// Replace code snippet background
code = code.replace(/bg-slate-900/g, 'bg-[#1e1e1e]');
code = code.replace(/bg-slate-800/g, 'bg-[#2d2d2d]');
code = code.replace(/border-slate-700/g, 'border-[#3d3d3d]');
code = code.replace(/text-slate-300/g, 'text-gray-300');
code = code.replace(/text-slate-50/g, 'text-gray-100');
code = code.split('bg-slate-200/50 dark:bg-slate-800/50').join('bg-ui-bg-hover');
code = code.split('bg-slate-300 dark:bg-slate-700').join('bg-ui-border');

// Roadmap page text update
const roadmapSearch = '<h3>Future Architecture Plans</h3>';
const roadmapReplace = `<h3>Planned</h3>
    <ul className="list-disc pl-6 space-y-2 mt-4 text-ui-fg">
      <li><strong>Live Collaboration:</strong> Multiplayer editing, presence, and real-time sync. Likely CRDT or WebSocket-based. Not yet architected.</li>
      <li><strong>AI Integration:</strong> AI-assisted features are planned; scope TBD.</li>
    </ul>
    <h3 className="mt-8">Future Architecture Plans</h3>`;

code = code.replace(roadmapSearch, roadmapReplace);

fs.writeFileSync('generate_docs.js', code);
console.log('Script updated successfully');
