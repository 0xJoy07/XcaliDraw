import { DocPage } from '../components/DocPage';
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
      code={`
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
`}
    />

    <KeyFiles files={['src/canvas/renderElement.ts', 'src/canvas/Canvas.tsx']} />

    <Gotchas title="Rough.js Randomness">
      Rough.js draws shapes with intentional sketch-like jitter. To ensure a shape doesn't "wiggle" constantly every frame, we MUST pass a consistent <code>seed</code> value in the options object. The seed is generated once during element creation.
    </Gotchas>
  </DocPage>
);
