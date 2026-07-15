import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { KeyFiles } from '../components/KeyFiles';

export const ToolbarDocs = () => (
  <DocPage
    title="Toolbar"
    description="Tool selection and active tool state."
    relatedPages={[
      { label: 'Adding a New Tool', to: 'contributing/adding-new-tool' }
    ]}
  >
    <p>
      The Toolbar sits at the top center of the screen and controls the <code>appState.activeTool</code>. It is a simple presentational component mapped to Lucide-React icons.
    </p>

    <CodeSnippet
      title="src/components/Toolbar.tsx"
      language="tsx"
      code={`
const ToolButton = ({ tool, icon: Icon, shortcut }) => {
  const activeTool = useElementsStore(state => state.appState.activeTool);
  const setAppState = useElementsStore(state => state.setAppState);
  
  const isActive = activeTool === tool;

  return (
    <button 
      onClick={() => setAppState({ activeTool: tool })}
      className={isActive ? 'bg-indigo-100 text-indigo-600' : ''}
    >
      <Icon size={20} />
    </button>
  );
};
`}
    />

    <KeyFiles files={['src/components/Toolbar.tsx']} />
  </DocPage>
);
