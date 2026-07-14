import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';

export const RunningAndBuilding = () => (
  <DocPage
    title="Running and Building"
    description="Scripts for local development, linting, and production builds."
    relatedPages={[{ label: 'Installation', to: 'getting-started/installation' }]}
  >
    <p>
      We use standard NPM scripts defined in <code>package.json</code> for all workflow automation.
    </p>

    <CodeSnippet
      title="package.json"
      language="json"
      code={`
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "oxlint",
  "preview": "vite preview"
}
`}
    />
    
    <h3>Production Build</h3>
    <p>
      Running <code>npm run build</code> will first invoke the TypeScript compiler to check types (<code>tsc -b</code>), and then use Vite to bundle the application into the <code>dist/</code> folder. Since this is a pure SPA, the output can be statically hosted anywhere (Vercel, Netlify, S3, etc.).
    </p>
  </DocPage>
);
