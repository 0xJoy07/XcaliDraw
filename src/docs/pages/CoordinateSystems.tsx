import { DocPage } from '../components/DocPage';
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
      code={`
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
`}
    />

    <KeyFiles files={['src/canvas/math.ts', 'src/canvas/Canvas.tsx']} />

    <Gotchas type="warning" title="Always transform pointers!">
      Never use <code>e.clientX</code> directly as an element coordinate. You must ALWAYS pass it through <code>screenToWorld</code> first, otherwise the element will draw far away from the mouse cursor as soon as the user pans or zooms.
    </Gotchas>
  </DocPage>
);
