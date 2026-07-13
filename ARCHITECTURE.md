# Architecture

## 1. Canvas Render Loop
The app uses a single `<canvas>` element for rendering all shapes. We do not use React state for continuous updates like dragging/panning to avoid frame drops. Instead, we use `requestAnimationFrame` (rAF) combined with a `dirty` flag. When store data changes, the flag is set, and the next rAF loop repaints the canvas and resets the flag.

## 2. Store (Zustand)
We use a Zustand store (`elementsStore.ts`) to manage:
- `elements`: Array of all drawn elements.
- `appState`: Context like `scrollX`, `scrollY`, `zoom`, `selectedElementIds`.
- `history`: Command stack for Undo/Redo.

## 3. Element Type (`types/element.ts`)
```ts
export type ElementType = 'rectangle' | 'ellipse' | 'diamond' | 'arrow' | 'line' | 'freedraw' | 'text' | 'image';

export interface Element {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  roughness: number;
  opacity: number;
  isDeleted: boolean;
  // Specific to freedraw
  points?: { x: number, y: number }[];
  // Specific to text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  // Specific to shape generation
  seed: number;
  // Specific to image
  fileId?: string;
}
```

## 8. AI Organize
For the "Organize" feature, we reduce the elements array to a minimal representation (position and size only) to send to the LLM. 
**Strict System Prompt**: "You are an expert layout designer. Organize the following elements to improve readability. Return ONLY a valid JSON array of objects with id, x, y, width, height. Do not alter IDs or add/remove elements. Do not include markdown formatting."

## 9. API Key Management (`types/apiKey.ts`)
```ts
export interface ApiKeyEntry {
  key: string;
  status: 'active' | 'exhausted' | 'invalid';
  exhaustedUntil?: number;
}
```
`callGroqWithFallback` iterates over available active keys, updating their status upon 429 (exhausted) or 401 (invalid) errors.
