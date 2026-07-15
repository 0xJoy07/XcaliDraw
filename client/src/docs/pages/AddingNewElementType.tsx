import { DocPage } from '../components/DocPage';
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
        <CodeSnippet language="typescript" code={`
case 'triangle':
  rc.polygon([
    [element.x + element.width/2, element.y],
    [element.x, element.y + element.height],
    [element.x + element.width, element.y + element.height]
  ], options);
  break;
`} />
      </li>
      <li>
        <strong>Update Spatial Indexing (Optional but recommended)</strong>
        <p>By default, <code>hitTest.ts</code> treats everything as a simple bounding-box rectangle for collision. If your shape is complex, you may need to add custom point-in-polygon math to the detailed hit testing phase.</p>
      </li>
    </ol>

    <KeyFiles files={['src/types/element.ts', 'src/canvas/Canvas.tsx', 'src/canvas/renderElement.ts']} />
  </DocPage>
);
