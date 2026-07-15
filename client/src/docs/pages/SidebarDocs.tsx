import { DocPage } from '../components/DocPage';
import { KeyFiles } from '../components/KeyFiles';
import { CodeSnippet } from '../components/CodeSnippet';

export const SidebarDocs = () => (
  <DocPage
    title="Sidebar UI"
    description="The layout components mirroring Excalidraw's property panels."
    relatedPages={[
      { label: 'Toolbar', to: 'components/toolbar' }
    ]}
  >
    <p>
      The UI surrounding the canvas consists of floating panels with absolute positioning. The Sidebar specifically handles property mutation for the currently selected elements (or the default styles for the next drawn element).
    </p>
    <p>
      It is broken down into sub-panels like <code>StylePanel</code> and <code>SettingsPanel</code>.
    </p>

    <CodeSnippet
      title="src/components/StylePanel.tsx"
      language="tsx"
      code={`
const { appState, selectedElements } = useElementsStore((state) => ({
  appState: state.appState,
  selectedElements: state.elements.filter(el => 
    state.appState.selectedElementIds.includes(el.id)
  )
}));
const updateStyle = (key: string, value: any) => {
  if (selectedElements.length > 0) {
    selectedElements.forEach(el => updateElement(el.id, { [key]: value }));
  } else {
    setAppState({ currentItemStyle: { ...appState.currentItemStyle, [key]: value }});
  }
};
`}
    />

    <KeyFiles files={['src/components/StylePanel.tsx', 'src/components/SettingsPanel.tsx']} />
  </DocPage>
);
