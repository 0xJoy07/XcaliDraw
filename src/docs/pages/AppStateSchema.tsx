import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';

export const AppStateSchema = () => (
  <DocPage
    title="App State Schema"
    description="Viewport configuration, active tool, selection, and zoom."
    relatedPages={[
      { label: 'Element Schema', to: 'data-model/element-schema' },
      { label: 'State Management', to: 'architecture/state-management' }
    ]}
  >
    <p>
      Alongside the array of drawn elements, <code>AppState</code> manages the ephemeral UI state. This determines what tool the user is holding, where the camera is looking, and what styles are currently picked in the sidebar.
    </p>

    <CodeSnippet
      title="src/store/elementsStore.ts"
      language="typescript"
      code={`
export interface AppState {
  // Viewport / Camera
  scrollX: number;
  scrollY: number;
  zoom: number;
  
  // Interaction
  selectedElementIds: string[];
  activeTool: ToolType;
  isToolLocked?: boolean;
  
  // Default styles for the NEXT element to be drawn
  currentItemStyle: {
    strokeColor: string;
    backgroundColor: string;
    strokeWidth: number;
    roughness: number;
    fontFamily: string;
    fontSize: number;
    textAlign: 'left' | 'center' | 'right';
  };
  
  // UI Overlays
  contextMenu: { x: number, y: number, type: 'canvas' | 'element' } | null;
}
`}
    />
  </DocPage>
);
