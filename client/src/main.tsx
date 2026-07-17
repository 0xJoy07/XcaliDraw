import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { OAuthCallbackPage } from './pages/OAuthCallbackPage.tsx'
import { SignupPage } from './pages/SignupPage.tsx'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.tsx'
import { ResetPasswordPage } from './pages/ResetPasswordPage.tsx'
import { CanvasDashboardPage } from './pages/CanvasDashboardPage.tsx'
import { ProtectedRoute } from './routes/ProtectedRoute.tsx'
import { LandingPage } from './pages/LandingPage.tsx'

const DocsLayout = lazy(() => import('./docs/DocsLayout.tsx').then(m => ({ default: m.DocsLayout })))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-ui-fg bg-canvas-bg">Loading...</div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
            <Route path="/canvas/shared/:shareToken" element={<App />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<CanvasDashboardPage />} />
              <Route path="/canvases" element={<CanvasDashboardPage />} />
              <Route path="/canvas/:canvasId" element={<App />} />
            </Route>
            <Route path="/docs/*" element={<DocsLayout />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
