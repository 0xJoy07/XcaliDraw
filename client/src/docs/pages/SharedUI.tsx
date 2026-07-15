import { DocPage } from '../components/DocPage';
import { KeyFiles } from '../components/KeyFiles';

export const SharedUI = () => (
  <DocPage
    title="Shared UI"
    description="Reusable design system components."
    relatedPages={[
      { label: 'Code Style', to: 'contributing/code-style' }
    ]}
  >
    <p>
      The application leverages Tailwind CSS for rapid styling. To maintain consistency, we use unified class compositions and a centralized Toast notification system for alerts.
    </p>
    
    <h3>Toasts System</h3>
    <p>
      Instead of messy local state for alerts, we use a global framer-motion powered notification system in <code>Toasts.tsx</code>. You can trigger it from anywhere via Zustand.
    </p>

    <KeyFiles files={['src/components/Toasts.tsx', 'tailwind.config.js', 'src/index.css']} />
  </DocPage>
);
