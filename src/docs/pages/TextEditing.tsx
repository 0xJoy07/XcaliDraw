import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { KeyFiles } from '../components/KeyFiles';

export const TextEditing = () => (
  <DocPage
    title="Text Editing"
    description="The lifecycle of text elements: DOM overlay for editing vs Canvas for rendering."
    relatedPages={[
      { label: 'Architecture Overview', to: 'architecture/overview' }
    ]}
  >
    <p>
      HTML5 Canvas has notoriously poor support for text selection, carets, and IME (Input Method Editor for non-Latin languages). Because building a custom text editor inside canvas is a massive undertaking, we use a hybrid approach.
    </p>
    <p>
      When a text element enters "edit mode," we hide the canvas-rendered text and absolutely position a transparent HTML <code>&lt;textarea&gt;</code> over the exact same screen coordinates.
    </p>

    <CodeSnippet
      title="src/canvas/Canvas.tsx (TextEditorOverlay)"
      language="tsx"
      code={`
// Renders inside the Canvas component wrapper
{editingTextId && (
  <TextEditorOverlay
    elementId={editingTextId}
    onCommit={(val, width, height) => {
      // Commit the final string back to the Zustand store
      if (!val.trim()) {
        state.updateElement(editingElement.id, { isDeleted: true });
      } else {
        state.updateElement(editingElement.id, { 
          text: val, width, height 
        });
      }
      setEditingTextId(null);
    }}
  />
)}
`}
    />

    <KeyFiles files={['src/canvas/Canvas.tsx', 'src/canvas/renderElement.ts']} />
  </DocPage>
);
