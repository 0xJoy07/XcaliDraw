import { DocPage } from '../components/DocPage';
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
      code={`
if (isDraggingElems.current && e.buttons === 1) {
  const dx = x - startWorld.current.x;
  const dy = y - startWorld.current.y;
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
`}
    />

    <KeyFiles files={['src/canvas/Canvas.tsx', 'src/canvas/hitTest.ts']} />

    <Gotchas type="warning" title="Performance Issue: Constant Store Updates">
      Moving an element fires <code>updateElement</code> up to 60 times a second. Since our store creates immutable clones of the array, this causes heavy garbage collection. In a fully optimized version, we would mutate a working copy and only commit to the store on <code>pointerUp</code>.
    </Gotchas>
  </DocPage>
);
