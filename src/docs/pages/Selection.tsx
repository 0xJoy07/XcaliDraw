import { DocPage } from '../components/DocPage';
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
      code={`
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
`}
    />

    <KeyFiles files={['src/canvas/Canvas.tsx', 'src/canvas/hitTest.ts']} />
  </DocPage>
);
