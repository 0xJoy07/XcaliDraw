import { useState } from 'react';
import type { FormEvent } from 'react';
import { Code2, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { ApiError } from '../lib/authApi';

export const SignupPage = () => {
  const { register, loginWithProvider } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await register(email, password, name || undefined);
      navigate('/', { replace: true });
    } catch (caught) {
      setError((caught as ApiError).message || 'Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-canvas-bg text-ui-fg flex items-center justify-center px-4">
      <section className="w-full max-w-sm border border-ui-border bg-ui-bg rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-ui-fg">Sign up</h1>
          <p className="mt-1 text-sm text-ui-fg-muted">Create your Xcalidraw account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              className="mt-1 w-full rounded-md border border-ui-border bg-canvas-bg px-3 py-2 outline-none focus:border-ui-fg"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-md border border-ui-border bg-canvas-bg px-3 py-2 outline-none focus:border-ui-fg"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-ui-border bg-canvas-bg px-3 py-2 outline-none focus:border-ui-fg"
            />
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-ui-fg px-3 py-2 font-medium text-ui-bg hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="my-5 h-px bg-ui-border" />

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => loginWithProvider('google')}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-ui-border px-3 py-2 font-medium hover:bg-ui-bg-hover"
          >
            <Mail size={18} />
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => loginWithProvider('github')}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-ui-border px-3 py-2 font-medium hover:bg-ui-bg-hover"
          >
            <Code2 size={18} />
            Continue with GitHub
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-ui-fg-muted">
          Already have an account? <Link className="text-ui-fg underline" to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
};
