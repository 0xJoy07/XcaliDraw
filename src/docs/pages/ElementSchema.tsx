import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { Gotchas } from '../components/Gotchas';

export const ElementSchema = () => (
  <DocPage
    title="Element Schema"
    description="The shape of a canvas element object and per-type fields."
    relatedPages={[
      { label: 'State Management', to: 'architecture/state-management' },
      { label: 'Adding New Element Type', to: 'contributing/adding-element-type' }
    ]}
  >
    <p>
      Every shape on the canvas adheres to the <code>Element</code> interface. To keep types simple and avoid heavy polymorphism logic, we use a single discriminated union interface. 
    </p>

    <CodeSnippet
      title="src/types/element.ts"
      language="typescript"
      code={`
export interface Element {
  id: string;              // unique nanoid
  type: ToolType;          // 'rectangle' | 'text' | 'image' | etc
  
  // Spatial Data
  x: number;               // World coordinate X
  y: number;               // World coordinate Y
  width: number;           
  height: number;
  angle: number;           // Rotation in radians
  
  // Style Data
  strokeColor: string;
  backgroundColor: string;
  strokeWidth: number;
  roughness: number;
  opacity: number;
  
  // Roughjs consistency
  seed: number;            // Fixed random seed for deterministic rendering
  
  // Soft deletion (for undo/redo history safety)
  isDeleted: boolean;
  
  // --- Type-specific Optional Fields ---
  text?: string;           // Only for type === 'text'
  fontSize?: number;       // Only for type === 'text'
  points?: {x, y}[];       // Only for lines/arrows/freedraw
  fileId?: string;         // Only for images
}
`}
    />

    <Gotchas title="Soft Deletion (isDeleted)">
      We never use <code>array.splice()</code> or <code>.filter()</code> to delete elements from the master state array. We mark them <code>isDeleted: true</code>. This ensures the Z-index (array order) remains stable for history undo/redo operations and multi-user sync architectures (even though we don't have multiplayer yet).
    </Gotchas>
  </DocPage>
);
