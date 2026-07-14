import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { KeyFiles } from '../components/KeyFiles';

export const ProjectStructure = () => (
  <DocPage
    title="Project Structure"
    description="A high-level map of the repository organization."
    relatedPages={[
      { label: 'Architecture Overview', to: 'architecture/overview' },
      { label: 'Running & Building', to: 'getting-started/running-and-building' }
    ]}
  >
    <p>
      The application is cleanly divided between the core rendering engine (<code>src/canvas</code>), UI components (<code>src/components</code>), and global state (<code>src/store</code>).
    </p>

    <CodeSnippet
      title="Folder Map"
      language="text"
      code={`
src/
├── canvas/         # Core rendering, math, and hit-testing logic
│   ├── Canvas.tsx        # The main <canvas> React component and pointer event handlers
│   ├── renderElement.ts  # Logic mapping state to roughjs draw calls
│   └── hitTest.ts        # RBush tree integration and collision math
├── components/     # React UI elements overlaid on top of the canvas
│   ├── Sidebar.tsx
│   ├── Toolbar.tsx
│   └── ...
├── store/          # Zustand state management
│   └── elementsStore.ts  # The single source of truth for all canvas data
├── types/          # TypeScript interfaces (Element, ToolType, etc.)
└── lib/            # Utilities like export/import
`}
    />

    <KeyFiles files={['src/App.tsx', 'src/main.tsx', 'src/store/elementsStore.ts']} />
  </DocPage>
);
