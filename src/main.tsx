import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

const DocsLayout = lazy(() => import('./docs/DocsLayout.tsx').then(m => ({ default: m.DocsLayout })))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div className="flex h-screen items-center justify-center text-ui-fg bg-canvas-bg">Loading Docs...</div>}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/docs/*" element={<DocsLayout />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
