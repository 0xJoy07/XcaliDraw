import { DocPage } from '../components/DocPage';
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
        <CodeSnippet language="tsx" code={`<ToolButton tool="magicwand" icon={Wand2} label="Magic Select" />`} />
      </li>
      <li>
        <strong>Handle Pointer Down</strong>
        <p>In <code>src/canvas/Canvas.tsx</code> inside <code>handlePointerDown</code>, add a routing block for your tool.</p>
        <CodeSnippet language="typescript" code={`
if (state.appState.activeTool === 'magicwand') {
  // perform magic wand logic
  return; // Stop event propagation
}
`} />
      </li>
    </ol>
  </DocPage>
);
