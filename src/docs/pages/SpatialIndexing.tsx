import { DocPage } from '../components/DocPage';
import { CodeSnippet } from '../components/CodeSnippet';
import { KeyFiles } from '../components/KeyFiles';
import { Gotchas } from '../components/Gotchas';

export const SpatialIndexing = () => (
  <DocPage
    title="Spatial Indexing"
    description="RBush usage for lightning-fast hit-testing and selection queries."
    relatedPages={[
      { label: 'Selection', to: 'core-systems/selection' },
      { label: 'State Management', to: 'architecture/state-management' }
    ]}
  >
    <p>
      Iterating over 10,000 elements to see if the user clicked on one would cause severe input lag. To solve this, we maintain an <strong>R-Tree</strong> (specifically, the <code>rbush</code> library) that indexes the bounding boxes of all elements.
    </p>
    <p>
      Whenever elements are created, updated, or deleted, we call <code>updateRbush(elements)</code>. This clears the tree and re-inserts the minimal bounding boxes. During a pointer click, we query the tree with a tiny 1x1 bounding box at the cursor coordinates.
    </p>

    <CodeSnippet
      title="src/canvas/hitTest.ts"
      language="typescript"
      code={`
import RBush from 'rbush';

const tree = new RBush<any>();

export const updateRbush = (elements: Element[]) => {
  tree.clear();
  const items = elements.map((el) => {
    // ... calculate element bounds ...
    return { minX, minY, maxX, maxY, element: el };
  });
  tree.load(items);
};

export const hitTest = (x: number, y: number) => {
  // Query a small 10x10 area around the pointer for fuzziness
  const results = tree.search({
    minX: x - 5, minY: y - 5,
    maxX: x + 5, maxY: y + 5
  });
  
  // Sort by z-index (array order) to pick topmost element
  return results.pop()?.element || null;
};
`}
    />

    <KeyFiles files={['src/canvas/hitTest.ts', 'src/store/elementsStore.ts']} />

    <Gotchas>
      Because <code>updateRbush</code> rebuilds the tree, we ONLY call it when <code>elementsStore.ts</code> explicitly adds or mutates elements. If you mutate an element's x/y directly without calling <code>updateElement()</code> in the store, the RBush bounds will become stale and hit-testing will fail for that element.
    </Gotchas>
  </DocPage>
);
