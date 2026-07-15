import { DocPage } from '../components/DocPage';
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
      code={`
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
`}
    />

    <KeyFiles files={['src/canvas/Canvas.tsx']} />
  </DocPage>
);
