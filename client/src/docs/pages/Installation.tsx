import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { KeyFiles } from '../components/KeyFiles';
import { Gotchas } from '../components/Gotchas';

export const Installation = () => (
  <DocPage
    title="Installation"
    description="How to clone, install dependencies, and run the development server."
    relatedPages={[{ label: 'Project Structure', to: 'getting-started/project-structure' }]}
  >
    <p>
      Xcalidraw is built as a modern React application using Vite as the bundler. The stack relies heavily on <code>zustand</code> for state management, <code>roughjs</code> for hand-drawn rendering, and <code>rbush</code> for spatial indexing.
    </p>

    <h3>Prerequisites</h3>
    <ul>
      <li>Node.js (v18+ recommended)</li>
      <li>npm (v9+)</li>
    </ul>

    <h3>Setup Steps</h3>
    <CodeSnippet 
      title="Terminal"
      language="bash"
      code={`
# Clone the repository
git clone https://github.com/0xJoy07/Xcalidraw.git
cd Xcalidraw

# Install dependencies
npm install

# Start the Vite dev server
npm run dev
`} 
    />

    <KeyFiles files={['package.json', 'vite.config.ts']} />

    <Gotchas type="info" title="Vite Environment">
      Because we use Vite, environment variables must be prefixed with <code>VITE_</code>. However, the core app currently operates entirely client-side and requires zero environment variables to run locally!
    </Gotchas>
  </DocPage>
);
