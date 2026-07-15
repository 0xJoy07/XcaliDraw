<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/hero-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="./assets/hero-light.svg">
    <img alt="Xcalidraw Hero Banner" src="./assets/hero-light.svg">
  </picture>
</div>

<div align="center">
  <!-- TODO: record and embed demo GIF -->
  <br />
  
  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.herokuapp.com?font=Inter&weight=600&size=20&pause=1000&color=4F46E5&center=true&vCenter=true&width=435&lines=A+sleek%2C+single-user+drawing+canvas;Fast.+Hand-drawn.+Local-first." alt="Typing SVG" />
  </a>
  <br/>
  
  <img src="https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square" alt="Build Status" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-8.1-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
</div>

<br />

Xcalidraw is a fast, unopinionated, single-user drawing canvas built with a handcrafted, sketched aesthetic in mind. It provides a lightweight local-first whiteboard experience tailored for rapid diagramming and ideation.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/divider-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/divider-light.svg">
  <img alt="Divider" src="./assets/divider-light.svg">
</picture>

## 🚀 Quick Start

To get Xcalidraw running locally, clone the repository and start the Vite development server.

```bash
# Clone the repository
git clone https://github.com/0xJoy07/Xcalidraw.git
cd Xcalidraw

# Install dependencies
npm install

# Start the development server
npm run dev
```

Visit `http://localhost:5173` to view the application.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/divider-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/divider-light.svg">
  <img alt="Divider" src="./assets/divider-light.svg">
</picture>

## ✨ Features

Xcalidraw focuses on core diagramming mechanics with a custom infinite canvas renderer. 

- **Dynamic Canvas:** Hand-drawn shapes, precise hit-testing, and dynamic grid layouts.
- **Tools:** Move, resize, free-draw, text editing, and an ephemeral laser pointer.
- **Styling:** Fully customizable stroke colors, background fills, fonts, and "roughness" levels.

Read the detailed feature breakdown in [FEATURES.md](./FEATURES.md).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/divider-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/divider-light.svg">
  <img alt="Divider" src="./assets/divider-light.svg">
</picture>

## 🛠️ Tech Stack

Xcalidraw avoids heavy frameworks, relying strictly on specialized libraries for rendering and spatial data structures:
- **UI Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Canvas Rendering:** [Rough.js](https://roughjs.com/) (for sketchy, hand-drawn vector rendering)
- **Spatial Indexing:** [RBush](https://github.com/mourner/rbush) (for lightning-fast 2D hit-testing)
- **Syntax Highlighting:** [Prism React Renderer](https://github.com/FormidableLabs/prism-react-renderer) (for the documentation)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/divider-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/divider-light.svg">
  <img alt="Divider" src="./assets/divider-light.svg">
</picture>

## 📚 Documentation

Xcalidraw features an extensive built-in developer documentation suite. When running the app locally, you can access the full API and architecture documentation by visiting the `/docs` route (or clicking the "Documentations" button in the app toolbar).

- **Architecture Deep Dive:** View [ARCHITECTURE.md](./ARCHITECTURE.md) for a high-level summary, or dive into `/docs/architecture/overview` in the live app.
- **Feature Breakdown:** View [FEATURES.md](./FEATURES.md) for the current feature set.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/divider-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/divider-light.svg">
  <img alt="Divider" src="./assets/divider-light.svg">
</picture>

## 🗺️ Roadmap

Xcalidraw is currently a **single-user, non-collaborative** application. 

**Future Planned Scope:**
- **Live Collaboration:** WebRTC / WebSocket multiplayer sync layer via CRDTs (Yjs).
- **AI Integration:** Integrating generative UI and spatial canvas reasoning using open models.

*No ETA is provided for these features.*

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/divider-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/divider-light.svg">
  <img alt="Divider" src="./assets/divider-light.svg">
</picture>

## 📄 License

This project is licensed under the MIT License.
