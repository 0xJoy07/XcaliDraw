import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { ApiError } from '../lib/authApi';
import { DotGridBackground } from '../components/ui/DotGridBackground';
import { RoughCard } from '../components/ui/RoughCard';
import { RoughInput } from '../components/ui/RoughInput';
import { RoughButton } from '../components/ui/RoughButton';
import { DoodleAnim } from '../components/ui/DoodleAnim';

import { RoughLink } from '../components/ui/RoughLink';

// SVG components for Google/GitHub to replace lucide generic icons
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.28.73-.55v-1.84c-3.03.64-3.67-1.46-3.67-1.46-.55-1.29-1.28-1.65-1.28-1.65-1-.65.1-.65.1-.65 1.1.08 1.73 1.1 1.73 1.1.92 1.65 2.57 1.2 3.21.92a2 2 0 01.64-1.47c-2.47-.27-5.04-1.19-5.04-5.5 0-1.18.46-2.2 1.2-2.94-.14-.27-.55-1.37.14-2.93 0 0 1-.36 3.3 1.28a11.5 11.5 0 016 0c2.29-1.65 3.29-1.28 3.29-1.28.64 1.56.28 2.66.14 2.93.73.73 1.2 1.74 1.2 2.94 0 4.32-2.57 5.23-5.04 5.5.45.37.82 1.02.82 2.12v3.12c0 .27.19.64.73.55A11 11 0 0012 1.27"/>
  </svg>
);

export const LoginPage = () => {
  const { login, loginWithProvider } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const from = (location.state as any)?.from;
  const navigateTo = from ? from.pathname + (from.search || '') + (from.hash || '') : '/';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await login(email, password);
      navigate(navigateTo, { replace: true });
    } catch (caught) {
      setError((caught as ApiError).message || 'Could not log in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DotGridBackground>
      <div className="w-full max-w-sm">
        <DoodleAnim />
        <RoughCard>
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-virgil text-ink">Log in</h1>
            <p className="mt-1 text-sm font-virgil text-ink/70">Open your Xcalidraw workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-sans font-medium text-ink">Email</span>
              <RoughInput
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                autoComplete="email"
              />
            </label>

            <div className="space-y-1">
              <label className="block">
                <span className="text-sm font-sans font-medium text-ink">Password</span>
                <RoughInput
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </label>
              <div className="flex justify-end">
                <RoughLink className="text-sm font-sans font-medium text-ink/70 hover:text-ink" to="/forgot-password">
                  Forgot password?
                </RoughLink>
              </div>
            </div>

            {error && <p className="text-sm font-sans text-red-500">{error}</p>}

            <div className="pt-2">
              <RoughButton type="submit" disabled={submitting}>
                {submitting ? 'Logging in...' : 'Log in'}
              </RoughButton>
            </div>
          </form>

          <div className="my-6 flex items-center justify-center gap-4">
            <div className="h-px flex-1 bg-ink/10" />
            <span className="font-sans text-xs text-ink/50 uppercase tracking-widest">or</span>
            <div className="h-px flex-1 bg-ink/10" />
          </div>

          <div className="space-y-3">
            <RoughButton variant="secondary" type="button" onClick={() => loginWithProvider('google')} icon={<GoogleIcon />}>
              Continue with Google
            </RoughButton>
            <RoughButton variant="secondary" type="button" onClick={() => loginWithProvider('github')} icon={<GitHubIcon />}>
              Continue with GitHub
            </RoughButton>
          </div>

          <p className="mt-6 text-center text-sm font-sans text-ink/70">
            New here? <RoughLink className="text-ink font-medium" to="/signup" state={{ from }}>Create an account</RoughLink>
          </p>
        </RoughCard>
      </div>
    </DotGridBackground>
  );
};
