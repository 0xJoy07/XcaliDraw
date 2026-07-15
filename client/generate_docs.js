import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'src/docs/pages');
if (!fs.existsSync(pagesDir)) {
  fs.mkdirSync(pagesDir, { recursive: true });
}

const pages = {
  'DocsIndex.tsx': `import { DocPage } from '../components/DocPage';
import { PageLinks } from '../components/PageLinks';
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
        <h1 className="text-4xl font-extrabold tracking-tight text-ui-fg mb-4">
          Developer Documentation
        </h1>
        <p className="text-xl text-ui-fg-muted">
          Welcome to the Xcalidraw internals guide. This documentation covers the architecture, state management, and rendering pipelines of this single-user, canvas-based drawing application.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card, i) => (
          <Link 
            key={i} 
            to={card.to}
            className="flex items-start gap-4 p-6 rounded-2xl border border-ui-border hover:border-indigo-500 hover:shadow-md bg-ui-bg transition-all group"
          >
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
              <card.icon size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-ui-fg mb-1">{card.title}</h3>
              <p className="text-ui-fg-muted text-sm leading-relaxed">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
`,
  'Installation.tsx': `import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { KeyFiles } from '../components/KeyFiles';
import { Gotchas } from '../components/Gotchas';

export const Installation = () => (
  <DocPage
    title="Installation"
    description="How to clone, install dependencies, and run the development server."
    relatedPages={[{ label: 'Project Structure', to: 'getting-started/project-structure' }]}
  >
    <p>
      Xcalidraw is built as a modern React application using Vite as the bundler. The stack relies heavily on <code>zustand</code> for state management, <code>roughjs</code> for hand-drawn rendering, and <code>rbush</code> for spatial indexing.
    </p>

    <h3>Prerequisites</h3>
    <ul>
      <li>Node.js (v18+ recommended)</li>
      <li>npm (v9+)</li>
    </ul>

    <h3>Setup Steps</h3>
    <CodeSnippet 
      title="Terminal"
      language="bash"
      code={\`
# Clone the repository
git clone https://github.com/0xJoy07/Xcalidraw.git
cd xcalidraw

# Install dependencies
npm install

# Start the Vite dev server
npm run dev
\`} 
    />

    <KeyFiles files={['package.json', 'vite.config.ts']} />

    <Gotchas type="info" title="Vite Environment">
      Because we use Vite, environment variables must be prefixed with <code>VITE_</code>. However, the core app currently operates entirely client-side and requires zero environment variables to run locally!
    </Gotchas>
  </DocPage>
);
`,
  'ProjectStructure.tsx': `import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { KeyFiles } from '../components/KeyFiles';

export const ProjectStructure = () => (
  <DocPage
    title="Project Structure"
    description="A high-level map of the repository organization."
    relatedPages={[
      { label: 'Architecture Overview', to: 'architecture/overview' },
      { label: 'Running & Building', to: 'getting-started/running-and-building' }
    ]}
  >
    <p>
      The application is cleanly divided between the core rendering engine (<code>src/canvas</code>), UI components (<code>src/components</code>), and global state (<code>src/store</code>).
    </p>

    <CodeSnippet
      title="Folder Map"
      language="text"
      code={\`
src/
├── canvas/         # Core rendering, math, and hit-testing logic
│   ├── Canvas.tsx        # The main <canvas> React component and pointer event handlers
│   ├── renderElement.ts  # Logic mapping state to roughjs draw calls
│   └── hitTest.ts        # RBush tree integration and collision math
├── components/     # React UI elements overlaid on top of the canvas
│   ├── Sidebar.tsx
│   ├── Toolbar.tsx
│   └── ...
├── store/          # Zustand state management
│   └── elementsStore.ts  # The single source of truth for all canvas data
├── types/          # TypeScript interfaces (Element, ToolType, etc.)
└── lib/            # Utilities like export/import
\`}
    />

    <KeyFiles files={['src/App.tsx', 'src/main.tsx', 'src/store/elementsStore.ts']} />
  </DocPage>
);
`,
  'RunningAndBuilding.tsx': `import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';

export const RunningAndBuilding = () => (
  <DocPage
    title="Running and Building"
    description="Scripts for local development, linting, and production builds."
    relatedPages={[{ label: 'Installation', to: 'getting-started/installation' }]}
  >
    <p>
      We use standard NPM scripts defined in <code>package.json</code> for all workflow automation.
    </p>

    <CodeSnippet
      title="package.json"
      language="json"
      code={\`
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "oxlint",
  "preview": "vite preview"
}
\`}
    />
    
    <h3>Production Build</h3>
    <p>
      Running <code>npm run build</code> will first invoke the TypeScript compiler to check types (<code>tsc -b</code>), and then use Vite to bundle the application into the <code>dist/</code> folder. Since this is a pure SPA, the output can be statically hosted anywhere (Vercel, Netlify, S3, etc.).
    </p>
  </DocPage>
);
`,
  'ArchitectureOverview.tsx': `import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { KeyFiles } from '../components/KeyFiles';
import { Gotchas } from '../components/Gotchas';

export const ArchitectureOverview = () => (
  <DocPage
    title="Architecture Overview"
    description="High-level design of the canvas, state, and render loop."
    relatedPages={[
      { label: 'Render Pipeline', to: 'architecture/render-pipeline' },
      { label: 'State Management', to: 'architecture/state-management' }
    ]}
  >
    <p>
      Xcalidraw abandons the standard React rendering paradigm for its core canvas. While React is fantastic for DOM-based UI (like the Toolbar and Sidebar), it is not performant enough for 60fps continuous drawing across thousands of vector elements.
    </p>
    <p>
      Instead, we use a hybrid approach: React manages the overarching state via Zustand and renders the DOM UI overlay, while a custom <code>requestAnimationFrame</code> (RAF) loop manually clears and redraws a standard HTML5 <code>&lt;canvas&gt;</code> using Rough.js.
    </p>

    <CodeSnippet
      title="src/canvas/Canvas.tsx"
      language="tsx"
      code={\`
// The core hybrid setup
export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Custom RAF loop outside of React's render cycle
  useEffect(() => {
    const render = () => {
      const state = useElementsStore.getState();
      if (state.dirty) {
        // Redraw canvas using roughjs
        state.setDirty(false); // clear dirty flag
      }
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return <canvas ref={canvasRef} onPointerDown={...} />;
};
\`}
    />

    <KeyFiles files={['src/canvas/Canvas.tsx', 'src/store/elementsStore.ts']} />

    <Gotchas title="Why a dirty flag?">
      We only trigger a canvas redraw if <code>state.dirty</code> is true. If nothing moved or changed, the RAF loop skips the drawing phase, saving massive amounts of CPU/GPU overhead.
    </Gotchas>
  </DocPage>
);
`,
  'RenderPipeline.tsx': `import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { KeyFiles } from '../components/KeyFiles';
import { Gotchas } from '../components/Gotchas';

export const RenderPipeline = () => (
  <DocPage
    title="Render Pipeline"
    description="How the dirty-flag system, RAF loop, and rough.js draw calls work together."
    relatedPages={[
      { label: 'Architecture Overview', to: 'architecture/overview' },
      { label: 'Adding New Element Type', to: 'contributing/adding-element-type' }
    ]}
  >
    <p>
      Every frame, our <code>requestAnimationFrame</code> loop checks the global Zustand store's <code>dirty</code> boolean. When a tool or pointer event modifies an element (e.g. moving a rectangle), it calls a state updater which sets <code>dirty: true</code>.
    </p>
    <p>
      During a dirty frame, we:
      <ol>
        <li>Clear the entire canvas canvas contexts</li>
        <li>Apply the viewport transform (translation/zoom)</li>
        <li>Iterate over every element in <code>state.elements</code></li>
        <li>Pass the element to <code>renderElement(rc, ctx, element)</code> which wraps rough.js calls</li>
      </ol>
    </p>

    <CodeSnippet
      title="src/canvas/renderElement.ts"
      language="typescript"
      code={\`
export const renderElement = (rc: RoughCanvas, ctx: CanvasRenderingContext2D, element: Element) => {
  if (element.isDeleted) return;

  const options = {
    seed: element.seed,
    stroke: element.strokeColor || '#1e1e1e',
    fill: element.backgroundColor,
    strokeWidth: element.strokeWidth,
    roughness: element.roughness,
  };

  switch (element.type) {
    case 'rectangle':
      rc.rectangle(element.x, element.y, element.width, element.height, options);
      break;
    // ... other shapes ...
  }
};
\`}
    />

    <KeyFiles files={['src/canvas/renderElement.ts', 'src/canvas/Canvas.tsx']} />

    <Gotchas title="Rough.js Randomness">
      Rough.js draws shapes with intentional sketch-like jitter. To ensure a shape doesn't "wiggle" constantly every frame, we MUST pass a consistent <code>seed</code> value in the options object. The seed is generated once during element creation.
    </Gotchas>
  </DocPage>
);
`,
  'SpatialIndexing.tsx': `import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { KeyFiles } from '../components/KeyFiles';
import { Gotchas } from '../components/Gotchas';

export const SpatialIndexing = () => (
  <DocPage
    title="Spatial Indexing"
    description="RBush usage for lightning-fast hit-testing and selection queries."
    relatedPages={[
      { label: 'Selection', to: 'core-systems/selection' },
      { label: 'State Management', to: 'architecture/state-management' }
    ]}
  >
    <p>
      Iterating over 10,000 elements to see if the user clicked on one would cause severe input lag. To solve this, we maintain an <strong>R-Tree</strong> (specifically, the <code>rbush</code> library) that indexes the bounding boxes of all elements.
    </p>
    <p>
      Whenever elements are created, updated, or deleted, we call <code>updateRbush(elements)</code>. This clears the tree and re-inserts the minimal bounding boxes. During a pointer click, we query the tree with a tiny 1x1 bounding box at the cursor coordinates.
    </p>

    <CodeSnippet
      title="src/canvas/hitTest.ts"
      language="typescript"
      code={\`
import RBush from 'rbush';

const tree = new RBush<any>();

export const updateRbush = (elements: Element[]) => {
  tree.clear();
  const items = elements.map((el) => {
    // ... calculate element bounds ...
    return { minX, minY, maxX, maxY, element: el };
  });
  tree.load(items);
};

export const hitTest = (x: number, y: number) => {
  // Query a small 10x10 area around the pointer for fuzziness
  const results = tree.search({
    minX: x - 5, minY: y - 5,
    maxX: x + 5, maxY: y + 5
  });
  
  // Sort by z-index (array order) to pick topmost element
  return results.pop()?.element || null;
};
\`}
    />

    <KeyFiles files={['src/canvas/hitTest.ts', 'src/store/elementsStore.ts']} />

    <Gotchas>
      Because <code>updateRbush</code> rebuilds the tree, we ONLY call it when <code>elementsStore.ts</code> explicitly adds or mutates elements. If you mutate an element's x/y directly without calling <code>updateElement()</code> in the store, the RBush bounds will become stale and hit-testing will fail for that element.
    </Gotchas>
  </DocPage>
);
`,
  'StateManagement.tsx': `import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { KeyFiles } from '../components/KeyFiles';

export const StateManagement = () => (
  <DocPage
    title="State Management"
    description="Global application state, element models, and history using Zustand."
    relatedPages={[
      { label: 'Element Schema', to: 'data-model/element-schema' },
      { label: 'App State Schema', to: 'data-model/app-state-schema' }
    ]}
  >
    <p>
      Our entire data layer lives in a single Zustand store in <code>elementsStore.ts</code>. This provides a clean separation of concerns: React components subscribe to the UI state they need, while the canvas RAF loop queries <code>getState()</code> imperatively.
    </p>

    <CodeSnippet
      title="src/store/elementsStore.ts"
      language="typescript"
      code={\`
export const useElementsStore = create<ElementsStore>((set) => ({
  elements: initialElements,
  appState: { zoom: 1, scrollX: 0, scrollY: 0, activeTool: 'select', ... },
  dirty: true,
  
  setAppState: (newState) => set((state) => ({ 
    appState: { ...state.appState, ...newState }, 
    dirty: true 
  })),

  addElement: (element) => set((state) => {
    const newElements = [...state.elements, element];
    updateRbush(newElements);
    return { elements: newElements, dirty: true };
  }),
  // ... updateElement, undo, redo ...
}));
\`}
    />

    <h3>History (Undo / Redo)</h3>
    <p>
      The store maintains a <code>history</code> object with <code>past</code> and <code>future</code> arrays of complete element snapshots. Every time a major action completes (like finishing a drag, or completing a drawing), we push a clone of the elements array to <code>past</code>. Because we share unchanged element references across snapshots, memory usage remains relatively low despite saving full arrays.
    </p>

    <KeyFiles files={['src/store/elementsStore.ts']} />
  </DocPage>
);
`,
  'CoordinateSystems.tsx': `import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { KeyFiles } from '../components/KeyFiles';
import { Gotchas } from '../components/Gotchas';

export const CoordinateSystems = () => (
  <DocPage
    title="Coordinate Systems"
    description="Screen versus world coordinates, panning, and zooming math."
    relatedPages={[
      { label: 'Move & Resize', to: 'core-systems/move-and-resize' }
    ]}
  >
    <p>
      A major source of complexity in infinite-canvas applications is distinguishing between <strong>Screen Space</strong> (pixels on the monitor) and <strong>World Space</strong> (abstract coordinates of the drawn elements).
    </p>
    <ul>
      <li><strong>Screen Space</strong>: Origin <code>(0,0)</code> is the top-left of the <code>&lt;canvas&gt;</code> DOM node. E.g., <code>e.clientX</code>.</li>
      <li><strong>World Space</strong>: Origin <code>(0,0)</code> is the center of the infinite grid. E.g., <code>element.x</code>.</li>
    </ul>

    <CodeSnippet
      title="src/canvas/math.ts"
      language="typescript"
      code={\`
// Convert screen coordinates to world coordinates
export const screenToWorld = (clientX: number, clientY: number, appState: AppState) => {
  return {
    x: (clientX - appState.scrollX) / appState.zoom,
    y: (clientY - appState.scrollY) / appState.zoom
  };
};

// Convert world coordinates back to screen
export const worldToScreen = (worldX: number, worldY: number, appState: AppState) => {
  return {
    x: worldX * appState.zoom + appState.scrollX,
    y: worldY * appState.zoom + appState.scrollY
  };
};
\`}
    />

    <KeyFiles files={['src/canvas/math.ts', 'src/canvas/Canvas.tsx']} />

    <Gotchas type="warning" title="Always transform pointers!">
      Never use <code>e.clientX</code> directly as an element coordinate. You must ALWAYS pass it through <code>screenToWorld</code> first, otherwise the element will draw far away from the mouse cursor as soon as the user pans or zooms.
    </Gotchas>
  </DocPage>
);
`,
  'Selection.tsx': `import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { KeyFiles } from '../components/KeyFiles';

export const Selection = () => (
  <DocPage
    title="Selection System"
    description="Single and multi-select mechanics, marquee tools, and selection rendering."
    relatedPages={[
      { label: 'Spatial Indexing', to: 'architecture/spatial-indexing' },
      { label: 'Move & Resize', to: 'core-systems/move-and-resize' }
    ]}
  >
    <p>
      When the <code>activeTool</code> is set to <code>select</code>, clicking the canvas triggers the hit-testing pipeline. Selected elements have their IDs pushed into <code>appState.selectedElementIds</code>.
    </p>

    <h3>Multi-select (Marquee)</h3>
    <p>
      If the user clicks on an empty spot and drags, we track a <code>isMarquee</code> state flag and store the screen boundaries. During the RAF render loop, we draw a light blue selection rectangle based on these coordinates. On <code>pointerUp</code>, we use <code>rbush</code> to query all elements that intersect the bounding box.
    </p>

    <CodeSnippet
      title="src/canvas/Canvas.tsx"
      language="typescript"
      code={\`
if (isMarquee.current) {
  // End of drag
  isMarquee.current = false;
  
  const minX = Math.min(startWorld.current.x, x);
  const minY = Math.min(startWorld.current.y, y);
  const maxX = Math.max(startWorld.current.x, x);
  const maxY = Math.max(startWorld.current.y, y);

  // Use hit-testing utility to find all elements in rect
  const hitElements = getElementsInRect(minX, minY, maxX, maxY);
  
  state.setAppState({ 
    selectedElementIds: hitElements.map(el => el.id) 
  });
}
\`}
    />

    <KeyFiles files={['src/canvas/Canvas.tsx', 'src/canvas/hitTest.ts']} />
  </DocPage>
);
`,
  'MoveAndResize.tsx': `import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { KeyFiles } from '../components/KeyFiles';
import { Gotchas } from '../components/Gotchas';

export const MoveAndResize = () => (
  <DocPage
    title="Move and Resize"
    description="Drag logic, resize handle hit-testing, and scaling transforms."
    relatedPages={[
      { label: 'Selection', to: 'core-systems/selection' },
      { label: 'Coordinate Systems', to: 'architecture/coordinate-systems' }
    ]}
  >
    <p>
      When selected elements are dragged, we calculate the delta between the current mouse position and the original <code>pointerDown</code> position (in world coordinates), and apply that offset to the element's <code>x</code> and <code>y</code> coordinates.
    </p>

    <h3>Resize Handles</h3>
    <p>
      Selected elements are rendered with a bounding box and tiny square resize handles. We perform a secondary hit-test specifically against these handles (<code>hitTestHandle</code>). If a handle is clicked, the <code>pointerMove</code> event delegates to <code>resizeElement()</code>, which adjusts width/height and potentially shifts the origin (e.g., resizing from top-left shifts x/y AND width/height).
    </p>

    <CodeSnippet
      title="src/canvas/Canvas.tsx"
      language="typescript"
      code={\`
if (isDraggingElems.current && e.buttons === 1) {
  // Calculate drag delta
  const dx = x - startWorld.current.x;
  const dy = y - startWorld.current.y;
  
  // Apply delta relative to original positions snapshot
  state.appState.selectedElementIds.forEach(id => {
    const orig = origElems.current[id];
    if (orig) {
      state.updateElement(id, { 
        x: orig.x + dx, 
        y: orig.y + dy 
      });
    }
  });
}
\`}
    />

    <KeyFiles files={['src/canvas/Canvas.tsx', 'src/canvas/hitTest.ts']} />

    <Gotchas type="warning" title="Performance Issue: Constant Store Updates">
      Moving an element fires <code>updateElement</code> up to 60 times a second. Since our store creates immutable clones of the array, this causes heavy garbage collection. In a fully optimized version, we would mutate a working copy and only commit to the store on <code>pointerUp</code>.
    </Gotchas>
  </DocPage>
);
`,
  'TextEditing.tsx': `import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { KeyFiles } from '../components/KeyFiles';

export const TextEditing = () => (
  <DocPage
    title="Text Editing"
    description="The lifecycle of text elements: DOM overlay for editing vs Canvas for rendering."
    relatedPages={[
      { label: 'Architecture Overview', to: 'architecture/overview' }
    ]}
  >
    <p>
      HTML5 Canvas has notoriously poor support for text selection, carets, and IME (Input Method Editor for non-Latin languages). Because building a custom text editor inside canvas is a massive undertaking, we use a hybrid approach.
    </p>
    <p>
      When a text element enters "edit mode," we hide the canvas-rendered text and absolutely position a transparent HTML <code>&lt;textarea&gt;</code> over the exact same screen coordinates.
    </p>

    <CodeSnippet
      title="src/canvas/Canvas.tsx (TextEditorOverlay)"
      language="tsx"
      code={\`
// Renders inside the Canvas component wrapper
{editingTextId && (
  <TextEditorOverlay
    elementId={editingTextId}
    onCommit={(val, width, height) => {
      // Commit the final string back to the Zustand store
      if (!val.trim()) {
        state.updateElement(editingElement.id, { isDeleted: true });
      } else {
        state.updateElement(editingElement.id, { 
          text: val, width, height 
        });
      }
      setEditingTextId(null);
    }}
  />
)}
\`}
    />

    <KeyFiles files={['src/canvas/Canvas.tsx', 'src/canvas/renderElement.ts']} />
  </DocPage>
);
`,
  'LaserTool.tsx': `import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { Gotchas } from '../components/Gotchas';

export const LaserTool = () => (
  <DocPage
    title="Laser Tool"
    description="Ephemeral drawing and fade-out animation logic."
    relatedPages={[
      { label: 'Render Pipeline', to: 'architecture/render-pipeline' }
    ]}
  >
    <p>
      The Laser tool creates temporary strokes that fade away after 1 second, useful for presenting and pointing at things without cluttering the canvas.
    </p>
    <p>
      Unlike standard elements, laser strokes are <strong>NOT</strong> saved to the <code>elementsStore</code>! Because they mutate constantly during fade-out, storing them in Redux/Zustand would trigger massive re-render overhead. Instead, they exist entirely as a mutable React <code>ref</code> inside the Canvas component.
    </p>

    <CodeSnippet
      title="src/canvas/Canvas.tsx"
      language="typescript"
      code={\`
// Stored as a mutable ref
const laserLines = useRef<{ 
  points: { x: number; y: number }[]; 
  endTime: number | null 
}[]>([]);

// Custom RAF exclusively for fading out the laser
const renderLaser = () => {
  const lc = laserCanvasRef.current;
  const ctx = lc.getContext('2d');
  
  // Clean up expired lines
  laserLines.current = laserLines.current.filter(line => {
    if (line.endTime === null) return true; // Still drawing
    return (now - line.endTime) < 1000;     // Keep if < 1s old
  });
  
  // Calculate opacity based on time elapsed
  const globalAlpha = 1 - (elapsed / 1000);
  ctx.globalAlpha = globalAlpha;
  
  // Draw glow & inner core...
};
\`}
    />

    <Gotchas title="Dual Canvas Setup">
      To prevent the laser rendering from constantly dirtying the main canvas, the laser actually renders to a completely separate, transparent <code>&lt;canvas&gt;</code> layered directly on top of the main scene via absolute CSS positioning.
    </Gotchas>
  </DocPage>
);
`,
  'CanvasRoot.tsx': `import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { KeyFiles } from '../components/KeyFiles';

export const CanvasRoot = () => (
  <DocPage
    title="Canvas Root Component"
    description="The top-level controller for pointer events and rendering."
    relatedPages={[
      { label: 'Render Pipeline', to: 'architecture/render-pipeline' },
      { label: 'Coordinate Systems', to: 'architecture/coordinate-systems' }
    ]}
  >
    <p>
      The <code>&lt;Canvas /&gt;</code> component is the beating heart of the application. It spans over 1,000 lines of code because it must orchestrate every native pointer event, keyboard shortcut, rendering loop, and DOM overlay logic.
    </p>

    <CodeSnippet
      title="src/canvas/Canvas.tsx"
      language="tsx"
      code={\`
export const Canvas: React.FC = () => {
  // 1. Refs for DOM nodes and mutable drag states
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingElems = useRef(false);

  // 2. The render loops (Main scene + Laser overlay)
  useEffect(() => { ... }, []);

  // 3. Pointer Handlers (Routing logic based on activeTool)
  const handlePointerDown = (e) => { ... };
  const handlePointerMove = (e) => { ... };
  const handlePointerUp = (e) => { ... };

  // 4. Keyboard shortcuts (Undo/Redo, Tool switching, Deletion)
  useEffect(() => { ... }, []);

  return (
    <div className="relative w-full h-full overflow-hidden touch-none">
      <canvas ref={canvasRef} />
      <canvas ref={laserCanvasRef} className="absolute inset-0 pointer-events-none" />
      {/* Text editor overlays */}
    </div>
  );
};
\`}
    />

    <KeyFiles files={['src/canvas/Canvas.tsx']} />
  </DocPage>
);
`,
  'SidebarDocs.tsx': `import { DocPage } from '../components/DocPage';
import { KeyFiles } from '../components/KeyFiles';
import { CodeSnippet } from '../components/CodeSnippet';

export const SidebarDocs = () => (
  <DocPage
    title="Sidebar UI"
    description="The layout components mirroring Excalidraw's property panels."
    relatedPages={[
      { label: 'Toolbar', to: 'components/toolbar' }
    ]}
  >
    <p>
      The UI surrounding the canvas consists of floating panels with absolute positioning. The Sidebar specifically handles property mutation for the currently selected elements (or the default styles for the next drawn element).
    </p>
    <p>
      It is broken down into sub-panels like <code>StylePanel</code> and <code>SettingsPanel</code>.
    </p>

    <CodeSnippet
      title="src/components/StylePanel.tsx"
      language="tsx"
      code={\`
// The panel subscribes to the Zustand store directly
const { appState, selectedElements } = useElementsStore((state) => ({
  appState: state.appState,
  selectedElements: state.elements.filter(el => 
    state.appState.selectedElementIds.includes(el.id)
  )
}));

// Changing a style loops through selected elements and mutates them
const updateStyle = (key: string, value: any) => {
  if (selectedElements.length > 0) {
    selectedElements.forEach(el => updateElement(el.id, { [key]: value }));
  } else {
    // Or updates the default style if nothing is selected
    setAppState({ currentItemStyle: { ...appState.currentItemStyle, [key]: value }});
  }
};
\`}
    />

    <KeyFiles files={['src/components/StylePanel.tsx', 'src/components/SettingsPanel.tsx']} />
  </DocPage>
);
`,
  'ToolbarDocs.tsx': `import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { KeyFiles } from '../components/KeyFiles';

export const ToolbarDocs = () => (
  <DocPage
    title="Toolbar"
    description="Tool selection and active tool state."
    relatedPages={[
      { label: 'Adding a New Tool', to: 'contributing/adding-new-tool' }
    ]}
  >
    <p>
      The Toolbar sits at the top center of the screen and controls the <code>appState.activeTool</code>. It is a simple presentational component mapped to Lucide-React icons.
    </p>

    <CodeSnippet
      title="src/components/Toolbar.tsx"
      language="tsx"
      code={\`
const ToolButton = ({ tool, icon: Icon, shortcut }) => {
  const activeTool = useElementsStore(state => state.appState.activeTool);
  const setAppState = useElementsStore(state => state.setAppState);
  
  const isActive = activeTool === tool;

  return (
    <button 
      onClick={() => setAppState({ activeTool: tool })}
      className={isActive ? 'bg-indigo-100 text-indigo-600' : ''}
    >
      <Icon size={20} />
    </button>
  );
};
\`}
    />

    <KeyFiles files={['src/components/Toolbar.tsx']} />
  </DocPage>
);
`,
  'SharedUI.tsx': `import { DocPage } from '../components/DocPage';
import { KeyFiles } from '../components/KeyFiles';

export const SharedUI = () => (
  <DocPage
    title="Shared UI"
    description="Reusable design system components."
    relatedPages={[
      { label: 'Code Style', to: 'contributing/code-style' }
    ]}
  >
    <p>
      The application leverages Tailwind CSS for rapid styling. To maintain consistency, we use unified class compositions and a centralized Toast notification system for alerts.
    </p>
    
    <h3>Toasts System</h3>
    <p>
      Instead of messy local state for alerts, we use a global framer-motion powered notification system in <code>Toasts.tsx</code>. You can trigger it from anywhere via Zustand.
    </p>

    <KeyFiles files={['src/components/Toasts.tsx', 'tailwind.config.js', 'src/index.css']} />
  </DocPage>
);
`,
  'ElementSchema.tsx': `import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { Gotchas } from '../components/Gotchas';

export const ElementSchema = () => (
  <DocPage
    title="Element Schema"
    description="The shape of a canvas element object and per-type fields."
    relatedPages={[
      { label: 'State Management', to: 'architecture/state-management' },
      { label: 'Adding New Element Type', to: 'contributing/adding-element-type' }
    ]}
  >
    <p>
      Every shape on the canvas adheres to the <code>Element</code> interface. To keep types simple and avoid heavy polymorphism logic, we use a single discriminated union interface. 
    </p>

    <CodeSnippet
      title="src/types/element.ts"
      language="typescript"
      code={\`
export interface Element {
  id: string;              // unique nanoid
  type: ToolType;          // 'rectangle' | 'text' | 'image' | etc
  
  // Spatial Data
  x: number;               // World coordinate X
  y: number;               // World coordinate Y
  width: number;           
  height: number;
  angle: number;           // Rotation in radians
  
  // Style Data
  strokeColor: string;
  backgroundColor: string;
  strokeWidth: number;
  roughness: number;
  opacity: number;
  
  // Roughjs consistency
  seed: number;            // Fixed random seed for deterministic rendering
  
  // Soft deletion (for undo/redo history safety)
  isDeleted: boolean;
  
  // --- Type-specific Optional Fields ---
  text?: string;           // Only for type === 'text'
  fontSize?: number;       // Only for type === 'text'
  points?: {x, y}[];       // Only for lines/arrows/freedraw
  fileId?: string;         // Only for images
}
\`}
    />

    <Gotchas title="Soft Deletion (isDeleted)">
      We never use <code>array.splice()</code> or <code>.filter()</code> to delete elements from the master state array. We mark them <code>isDeleted: true</code>. This ensures the Z-index (array order) remains stable for history undo/redo operations and multi-user sync architectures (even though we don't have multiplayer yet).
    </Gotchas>
  </DocPage>
);
`,
  'AppStateSchema.tsx': `import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';

export const AppStateSchema = () => (
  <DocPage
    title="App State Schema"
    description="Viewport configuration, active tool, selection, and zoom."
    relatedPages={[
      { label: 'Element Schema', to: 'data-model/element-schema' },
      { label: 'State Management', to: 'architecture/state-management' }
    ]}
  >
    <p>
      Alongside the array of drawn elements, <code>AppState</code> manages the ephemeral UI state. This determines what tool the user is holding, where the camera is looking, and what styles are currently picked in the sidebar.
    </p>

    <CodeSnippet
      title="src/store/elementsStore.ts"
      language="typescript"
      code={\`
export interface AppState {
  // Viewport / Camera
  scrollX: number;
  scrollY: number;
  zoom: number;
  
  // Interaction
  selectedElementIds: string[];
  activeTool: ToolType;
  isToolLocked?: boolean;
  
  // Default styles for the NEXT element to be drawn
  currentItemStyle: {
    strokeColor: string;
    backgroundColor: string;
    strokeWidth: number;
    roughness: number;
    fontFamily: string;
    fontSize: number;
    textAlign: 'left' | 'center' | 'right';
  };
  
  // UI Overlays
  contextMenu: { x: number, y: number, type: 'canvas' | 'element' } | null;
}
\`}
    />
  </DocPage>
);
`,
  'CodeStyle.tsx': `import { DocPage } from '../components/DocPage';
import { Gotchas } from '../components/Gotchas';

export const CodeStyle = () => (
  <DocPage
    title="Code Style & Conventions"
    description="Naming conventions, file organization, and architectural rules."
    relatedPages={[
      { label: 'Adding a New Tool', to: 'contributing/adding-new-tool' }
    ]}
  >
    <p>
      We strive for a pragmatic, functional programming approach. React components handle the DOM, standard TypeScript handles the math, and Zustand acts as the glue.
    </p>

    <h3>1. Avoid React Context for Canvas Data</h3>
    <p>
      Never put elements inside a React Context. High-frequency updates (60fps pointer moves) will cause massive cascading re-renders across the entire component tree. Always use the Zustand store.
    </p>

    <h3>2. Math functions should be pure</h3>
    <p>
      Calculations in <code>math.ts</code> and <code>hitTest.ts</code> must be pure functions. They should accept numbers and return numbers. They should not read directly from <code>window</code> or the global store.
    </p>

    <h3>3. Tailwind Usage</h3>
    <p>
      Keep Tailwind classes organized. Group layout (flex, relative), then spacing (p-4, m-2), then colors (bg-white, text-slate), then interactivity (hover:, active:).
    </p>
    
    <Gotchas title="Ref usage vs State usage">
      In <code>Canvas.tsx</code>, if a value changes during a drag (like <code>isDragging</code> or <code>drawingElementId</code>), it MUST be a <code>useRef</code>, not <code>useState</code>. Using <code>useState</code> inside the pointer event loop will trigger React renders mid-drag and drop your framerate to 15fps.
    </Gotchas>
  </DocPage>
);
`,
  'AddingNewTool.tsx': `import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';

export const AddingNewTool = () => (
  <DocPage
    title="Adding a New Tool"
    description="Step-by-step checklist for registering a new tool in the toolbar."
    relatedPages={[
      { label: 'Adding Element Type', to: 'contributing/adding-element-type' }
    ]}
  >
    <p>
      To add a new tool (e.g., a "Magic Wand" selector) that does not necessarily create a new shape, follow these steps:
    </p>

    <ol className="list-decimal pl-6 space-y-4 my-6">
      <li>
        <strong>Add to ToolType Union</strong>
        <p>In <code>src/store/elementsStore.ts</code>, add your tool name to the <code>ToolType</code> union type.</p>
        <CodeSnippet language="typescript" code="export type ToolType = 'select' | ... | 'magicwand';" />
      </li>
      <li>
        <strong>Add UI Button</strong>
        <p>In <code>src/components/Toolbar.tsx</code>, import a Lucide icon and add a <code>&lt;ToolButton&gt;</code>.</p>
        <CodeSnippet language="tsx" code="<ToolButton tool=\"magicwand\" icon={Wand2} label=\"Magic Select\" />" />
      </li>
      <li>
        <strong>Handle Pointer Down</strong>
        <p>In <code>src/canvas/Canvas.tsx</code> inside <code>handlePointerDown</code>, add a routing block for your tool.</p>
        <CodeSnippet language="typescript" code={\`
if (state.appState.activeTool === 'magicwand') {
  // perform magic wand logic
  return; // Stop event propagation
}
\`} />
      </li>
    </ol>
  </DocPage>
);
`,
  'AddingNewElementType.tsx': `import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { KeyFiles } from '../components/KeyFiles';

export const AddingNewElementType = () => (
  <DocPage
    title="Adding a New Element Type"
    description="Schema updates, rough.js renderer updates, and hit-testing logic."
    relatedPages={[
      { label: 'Adding a New Tool', to: 'contributing/adding-new-tool' }
    ]}
  >
    <p>
      Adding a completely new shape (e.g. a <strong>Triangle</strong>) requires touching the entire render pipeline.
    </p>

    <ol className="list-decimal pl-6 space-y-4 my-6">
      <li>
        <strong>Update Element Schema</strong>
        <p>Add fields to the <code>Element</code> interface in <code>types/element.ts</code> if your shape needs custom geometry data (like a 3rd point coordinate).</p>
      </li>
      <li>
        <strong>Create the Canvas Handler</strong>
        <p>In <code>Canvas.tsx</code>, intercept the PointerDown event to instantiate your new object in the store with an initial width/height of 0.</p>
      </li>
      <li>
        <strong>Implement the Renderer</strong>
        <p>In <code>renderElement.ts</code>, add a new <code>case</code> statement calling the appropriate <code>roughjs</code> method.</p>
        <CodeSnippet language="typescript" code={\`
case 'triangle':
  rc.polygon([
    [element.x + element.width/2, element.y],
    [element.x, element.y + element.height],
    [element.x + element.width, element.y + element.height]
  ], options);
  break;
\`} />
      </li>
      <li>
        <strong>Update Spatial Indexing (Optional but recommended)</strong>
        <p>By default, <code>hitTest.ts</code> treats everything as a simple bounding-box rectangle for collision. If your shape is complex, you may need to add custom point-in-polygon math to the detailed hit testing phase.</p>
      </li>
    </ol>

    <KeyFiles files={['src/types/element.ts', 'src/canvas/Canvas.tsx', 'src/canvas/renderElement.ts']} />
  </DocPage>
);
`,
  'DebuggingTips.tsx': `import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { Gotchas } from '../components/Gotchas';

export const DebuggingTips = () => (
  <DocPage
    title="Debugging Tips"
    description="How to inspect dirty regions, rbush trees, and render calls."
    relatedPages={[
      { label: 'Render Pipeline', to: 'architecture/render-pipeline' }
    ]}
  >
    <p>
      Canvas bugs can be notoriously hard to track down because there is no DOM to inspect. Everything is just pixels. Here are some tricks.
    </p>

    <h3>1. Visualizing the RBush Bounding Boxes</h3>
    <p>
      If selection is failing, the spatial index is usually out of sync with the render coordinates. You can force the canvas to draw the invisible RBush bounds by injecting this into <code>Canvas.tsx</code>'s render loop:
    </p>
    
    <CodeSnippet
      title="src/canvas/Canvas.tsx"
      language="typescript"
      code={\`
// Temporary debug visualization inside render()
ctx.strokeStyle = 'red';
state.elements.forEach(el => {
  // calculate minX/minY/maxX/maxY exactly as hitTest.ts does
  ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
});
\`}
    />

    <h3>2. Auditing the Dirty Flag</h3>
    <p>
      If your fans are spinning up, you might have a render leak where <code>dirty</code> is stuck on <code>true</code>. Add a <code>console.log('Rendering frame')</code> inside the RAF loop. It should ONLY print when you are actively moving the mouse or modifying state. If it prints while the app is idle, search for a rogue <code>setAppState({ dirty: true })</code> call.
    </p>

    <Gotchas type="warning" title="React DevTools Profiler">
      Do not trust the React DevTools Profiler for canvas performance! Because our heavy lifting happens in a raw RAF loop, React DevTools will report near 0ms execution time, completely ignoring the Canvas API bottleneck.
    </Gotchas>
  </DocPage>
);
`,
  'Roadmap.tsx': `import { DocPage } from '../components/DocPage';
import { Gotchas } from '../components/Gotchas';

export const Roadmap = () => (
  <DocPage
    title="Roadmap & Known Gaps"
    description="What's missing and where we are heading."
  >
    <Gotchas type="info" title="Current Status: Single-Player Mode">
      This application is explicitly designed as a <strong>single-user, local-first</strong> experience. There is currently no backend, no real-time WebSocket sync, and no CRDT layer to handle multi-user conflicts.
    </Gotchas>

    <h3>Known Gaps</h3>
    <ul className="list-disc pl-6 space-y-2 mt-4 text-ui-fg">
      <li><strong>Snapping & Grids:</strong> Elements currently move freely. There are no smart guides or grid-snapping constraints implemented.</li>
      <li><strong>Grouping:</strong> You cannot group multiple elements into a single logical container block yet.</li>
      <li><strong>Z-Index Sorting:</strong> Elements are drawn strictly based on array insertion order. There are no "Bring Forward" or "Send Backward" commands.</li>
      <li><strong>Image Embeds:</strong> The image tool creates basic placeholder bounding boxes, but robust base64 serialization and local storage limits need optimization.</li>
    </ul>

    <h3 className="mt-8">Future Architecture Plans</h3>
    <p>
      If we ever shift to multiplayer, the <code>elementsStore.ts</code> will need a massive refactor to replace the simple Zustand array with Yjs or Automerge. The <code>isDeleted</code> soft-deletion flag was implemented specifically to prepare for this future transition, preventing array index shifting.
    </p>
  </DocPage>
);
`
};

for (const [filename, content] of Object.entries(pages)) {
  fs.writeFileSync(path.join(pagesDir, filename), content);
}
console.log('Docs pages generated successfully.');
