# Features

## Phase 1: Canvas Pan & Zoom
- Scroll wheel: Pans canvas.
- Middle-click / Space / Hand tool: Pans canvas. (Two-finger effect on laptop/trackpad for that).
- Ctrl/Cmd + Scroll: Zooms at cursor.

## Phase 2: Shape Tools
- Tools: select, rectangle, ellipse, diamond, arrow, line.
- Resizing (8 handles) and Rotation.

## Phase 7: Context Menu
- Empty canvas: Shows "Select All", "Paste", "Undo", "Redo".
- Selected element: Shows "Copy", "Delete", "Bring to Front", "Send to Back".

## Phase 9: Persistence
- Elements stored in `localStorage`.
- Image blobs stored in `IndexedDB`.

## Phase 10: Laser Tool
- Separate non-persisted transparent canvas.
- Fading laser pointer.

## Phase 12: AI Organize
- Calls Groq API to arrange nodes visually without altering text/styles.
- Animates position transitions (lerp).
