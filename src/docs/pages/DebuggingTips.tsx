import { DocPage } from '../components/DocPage';
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
      code={`
// Temporary debug visualization inside render()
ctx.strokeStyle = 'red';
state.elements.forEach(el => {
  // calculate minX/minY/maxX/maxY exactly as hitTest.ts does
  ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
});
`}
    />

    <h3>2. Auditing the Dirty Flag</h3>
    <p>
      If your fans are spinning up, you might have a render leak where <code>dirty</code> is stuck on <code>true</code>. Add a <code>console.log('Rendering frame')</code> inside the RAF loop. It should ONLY print when you are actively moving the mouse or modifying state. If it prints while the app is idle, search for a rogue <code>setAppState(&#123; dirty: true &#125;)</code> call.
    </p>

    <Gotchas type="warning" title="React DevTools Profiler">
      Do not trust the React DevTools Profiler for canvas performance! Because our heavy lifting happens in a raw RAF loop, React DevTools will report near 0ms execution time, completely ignoring the Canvas API bottleneck.
    </Gotchas>
  </DocPage>
);
