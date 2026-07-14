import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { KeyFiles } from '../components/KeyFiles';

export const StateManagement = () => (
  <DocPage
    title="State Management"
    description="Global application state, element models, and history using Zustand."
    relatedPages={[
      { label: 'Element Schema', to: 'data-model/element-schema' },
      { label: 'App State Schema', to: 'data-model/app-state-schema' }
    ]}
  >
    <p>
      Our entire data layer lives in a single Zustand store in <code>elementsStore.ts</code>. This provides a clean separation of concerns: React components subscribe to the UI state they need, while the canvas RAF loop queries <code>getState()</code> imperatively.
    </p>

    <CodeSnippet
      title="src/store/elementsStore.ts"
      language="typescript"
      code={`
export const useElementsStore = create<ElementsStore>((set) => ({
  elements: initialElements,
  appState: { zoom: 1, scrollX: 0, scrollY: 0, activeTool: 'select', ... },
  dirty: true,
  
  setAppState: (newState) => set((state) => ({ 
    appState: { ...state.appState, ...newState }, 
    dirty: true 
  })),

  addElement: (element) => set((state) => {
    const newElements = [...state.elements, element];
    updateRbush(newElements);
    return { elements: newElements, dirty: true };
  }),
  // ... updateElement, undo, redo ...
}));
`}
    />

    <h3>History (Undo / Redo)</h3>
    <p>
      The store maintains a <code>history</code> object with <code>past</code> and <code>future</code> arrays of complete element snapshots. Every time a major action completes (like finishing a drag, or completing a drawing), we push a clone of the elements array to <code>past</code>. Because we share unchanged element references across snapshots, memory usage remains relatively low despite saving full arrays.
    </p>

    <KeyFiles files={['src/store/elementsStore.ts']} />
  </DocPage>
);
