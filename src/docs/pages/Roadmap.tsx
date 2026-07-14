import { DocPage } from '../components/DocPage';
import { Gotchas } from '../components/Gotchas';

export const Roadmap = () => (
  <DocPage
    title="Roadmap & Known Gaps"
    description="What's missing and where we are heading."
  >
    <Gotchas type="info" title="Current Status: Single-Player Mode">
      This application is explicitly designed as a <strong>single-user, local-first</strong> experience. There is currently no backend, no real-time WebSocket sync, and no CRDT layer to handle multi-user conflicts.
    </Gotchas>

    <h3>Known Gaps</h3>
    <ul className="list-disc pl-6 space-y-2 mt-4 text-ui-fg">
      <li><strong>Snapping & Grids:</strong> Elements currently move freely. There are no smart guides or grid-snapping constraints implemented.</li>
      <li><strong>Grouping:</strong> You cannot group multiple elements into a single logical container block yet.</li>
      <li><strong>Z-Index Sorting:</strong> Elements are drawn strictly based on array insertion order. There are no "Bring Forward" or "Send Backward" commands.</li>
      <li><strong>Image Embeds:</strong> The image tool creates basic placeholder bounding boxes, but robust base64 serialization and local storage limits need optimization.</li>
    </ul>

    <h3 className="mt-8">Future Architecture Plans</h3>
    <p>
      If we ever shift to multiplayer, the <code>elementsStore.ts</code> will need a massive refactor to replace the simple Zustand array with Yjs or Automerge. The <code>isDeleted</code> soft-deletion flag was implemented specifically to prepare for this future transition, preventing array index shifting.
    </p>
  </DocPage>
);
