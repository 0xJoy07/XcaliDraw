import { DocPage } from '../components/DocPage';
import { Gotchas } from '../components/Gotchas';

export const CodeStyle = () => (
  <DocPage
    title="Code Style & Conventions"
    description="Naming conventions, file organization, and architectural rules."
    relatedPages={[
      { label: 'Adding a New Tool', to: 'contributing/adding-new-tool' }
    ]}
  >
    <p>
      We strive for a pragmatic, functional programming approach. React components handle the DOM, standard TypeScript handles the math, and Zustand acts as the glue.
    </p>

    <h3>1. Avoid React Context for Canvas Data</h3>
    <p>
      Never put elements inside a React Context. High-frequency updates (60fps pointer moves) will cause massive cascading re-renders across the entire component tree. Always use the Zustand store.
    </p>

    <h3>2. Math functions should be pure</h3>
    <p>
      Calculations in <code>math.ts</code> and <code>hitTest.ts</code> must be pure functions. They should accept numbers and return numbers. They should not read directly from <code>window</code> or the global store.
    </p>

    <h3>3. Tailwind Usage</h3>
    <p>
      Keep Tailwind classes organized. Group layout (flex, relative), then spacing (p-4, m-2), then colors (bg-white, text-slate), then interactivity (hover:, active:).
    </p>
    
    <Gotchas title="Ref usage vs State usage">
      In <code>Canvas.tsx</code>, if a value changes during a drag (like <code>isDragging</code> or <code>drawingElementId</code>), it MUST be a <code>useRef</code>, not <code>useState</code>. Using <code>useState</code> inside the pointer event loop will trigger React renders mid-drag and drop your framerate to 15fps.
    </Gotchas>
  </DocPage>
);
