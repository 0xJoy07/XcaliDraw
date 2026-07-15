import { DocPage } from '../components/DocPage';
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
      code={`
const laserLines = useRef<{ 
  points: { x: number; y: number }[]; 
  endTime: number | null 
}[]>([]);
const renderLaser = () => {
  const lc = laserCanvasRef.current;
  const ctx = lc.getContext('2d');
  laserLines.current = laserLines.current.filter(line => {
    if (line.endTime === null) return true; // Still drawing
    return (now - line.endTime) < 1000;     // Keep if < 1s old
  });
  const globalAlpha = 1 - (elapsed / 1000);
  ctx.globalAlpha = globalAlpha;
};
`}
    />

    <Gotchas title="Dual Canvas Setup">
      To prevent the laser rendering from constantly dirtying the main canvas, the laser actually renders to a completely separate, transparent <code>&lt;canvas&gt;</code> layered directly on top of the main scene via absolute CSS positioning.
    </Gotchas>
  </DocPage>
);
