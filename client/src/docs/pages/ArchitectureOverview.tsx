import { DocPage } from '../components/DocPage';
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
      code={`
export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const render = () => {
      const state = useElementsStore.getState();
      if (state.dirty) {
        state.setDirty(false); // clear dirty flag
      }
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return <canvas ref={canvasRef} onPointerDown={...} />;
};
`}
    />

    <KeyFiles files={['src/canvas/Canvas.tsx', 'src/store/elementsStore.ts']} />

    <Gotchas title="Why a dirty flag?">
      We only trigger a canvas redraw if <code>state.dirty</code> is true. If nothing moved or changed, the RAF loop skips the drawing phase, saving massive amounts of CPU/GPU overhead.
    </Gotchas>
  </DocPage>
);
