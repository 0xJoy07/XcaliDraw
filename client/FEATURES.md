# Core Features

Xcalidraw is a minimalist, local-first diagramming tool focused on providing a fluid sketching experience. Below is a breakdown of the current and planned feature set.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/divider-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/divider-light.svg">
  <img alt="Divider" src="./assets/divider-light.svg">
</picture>

## 🟢 Available Now

### Dynamic Selection & Hit-Testing
Users can click directly on paths, bounding boxes, or text elements to select them, or click and drag to draw an area-select marquee. The selection engine leverages an R-tree spatial index to perform rapid pointer intersection tests, ensuring 60 FPS selection responsiveness even on canvases with thousands of objects.
<!-- TODO: record and embed demo GIF for Selection -->
> 📖 **Deep Dive:** See [`/docs/core-systems/selection`](/docs/core-systems/selection) for implementation details on hit-testing and bounding boxes.

### Move, Resize & Transform
Selected objects render a bounding box with 8-way resize handles. Dragging the center of the bounding box translates the elements across world coordinates. Dragging a specific handle dynamically scales and repositions the selected geometry based on anchor constraints. 
<!-- TODO: record and embed demo GIF for Move & Resize -->
> 📖 **Deep Dive:** See [`/docs/core-systems/move-and-resize`](/docs/core-systems/move-and-resize) for details on delta application and bounds mapping.

### Infinite Canvas Navigation
The drawing space is boundless. Users can hold the Spacebar to pan the camera across the world, or use `Ctrl` + Mouse Wheel to zoom in and out. The coordinate system translates screen-space interactions mathematically into world-space offsets before processing inputs.
<!-- TODO: record and embed demo GIF for Canvas Navigation -->

### Inline Text Editing
A custom absolute-positioned `textarea` overlay synchronizes seamlessly with the underlying canvas transform. When a user creates or edits a text element, the overlay appears perfectly positioned in screen-space, supporting multi-line input before committing the final string back to the canvas renderer.
<!-- TODO: record and embed demo GIF for Text Editing -->
> 📖 **Deep Dive:** See [`/docs/core-systems/text-editing`](/docs/core-systems/text-editing) for the overlay synchronization architecture.

### Laser Pointer Tool
A specialized ephemeral drawing tool for presentations. The laser tool leaves a fading trail behind the cursor that decays and vanishes over a short timeframe, driven by a dedicated, isolated `requestAnimationFrame` loop to avoid triggering heavy full-scene redraws.
<!-- TODO: record and embed demo GIF for Laser Tool -->
> 📖 **Deep Dive:** See [`/docs/core-systems/laser-tool`](/docs/core-systems/laser-tool) for the standalone rendering loop mechanics.

### Thematic Styling Engine
Elements can be customized via the properties panel, allowing modifications to:
- Stroke color and fill color
- Hand-drawn "roughness" intensity (clean, hand-drawn, highly sketchy)
- Font family and size
- Dark and Light mode synchronization at the app root

### Account Authentication
Users can register and log in with email/password, or continue with Google and GitHub OAuth. Sessions use short-lived JWT access tokens in client memory plus httpOnly refresh cookies, with refresh-token rotation handled by the Express/MongoDB server.

### Per-Account Canvas Persistence
Each signed-in user has a dashboard of saved canvases loaded through a lightweight list endpoint. Opening a canvas fetches the full document, and edits autosave back to MongoDB with retry handling for temporary network failures.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/divider-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/divider-light.svg">
  <img alt="Divider" src="./assets/divider-light.svg">
</picture>

## 🟠 Planned (Future Scope)

Xcalidraw is currently a single-player experience. The following features are on the technical roadmap but are **not yet built**.

### Live Collaboration (Multiplayer)
A real-time sync layer leveraging Conflict-free Replicated Data Types (CRDTs), specifically through `Yjs`. This will allow multiple clients to connect via WebSockets or WebRTC to edit the same spatial index simultaneously without race conditions or server-side locks.

### AI Integration
Integrating generative UI and spatial canvas reasoning using open models, allowing the canvas to act as a multimodal surface where agents can generate diagrams, rearrange nodes, or critique architectures drawn by the user.
