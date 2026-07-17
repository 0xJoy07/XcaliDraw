import { useState } from 'react';
import type { FormEvent } from 'react';
import { authApi } from '../lib/authApi';
import type { ApiError } from '../lib/authApi';
import { DotGridBackground } from '../components/ui/DotGridBackground';
import { RoughCard } from '../components/ui/RoughCard';
import { RoughInput } from '../components/ui/RoughInput';
import { RoughButton } from '../components/ui/RoughButton';
import { RoughLink } from '../components/ui/RoughLink';
import { DoodleAnim } from '../components/ui/DoodleAnim';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (caught) {
      setError((caught as ApiError).message || 'Could not send reset link');
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
            <h1 className="text-3xl font-virgil text-ink">Reset your password</h1>
            {!success && (
              <p className="mt-1 text-sm font-sans text-ink/70">
                Enter your email and we'll send you a reset link.
              </p>
            )}
          </div>

          {success ? (
            <div className="space-y-6">
              <div className="rounded-md border-2 border-green-500 bg-green-50 p-4">
                <p className="text-sm font-sans font-medium text-green-800">
                  If an account exists for that email, we've sent a reset link. Check your inbox.
                </p>
              </div>
              <div className="text-center">
                <RoughLink className="text-sm font-sans font-medium text-ink hover:text-ink/70" to="/login">
                  Return to log in
                </RoughLink>
              </div>
            </div>
          ) : (
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

              {error && <p className="text-sm font-sans text-red-500">{error}</p>}

              <div className="pt-2">
                <RoughButton type="submit" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send reset link'}
                </RoughButton>
              </div>

              <div className="my-6 flex items-center justify-center gap-4">
                <div className="h-px flex-1 bg-ink/10" />
              </div>

              <p className="text-center text-sm font-sans text-ink/70">
                Remembered your password? <RoughLink className="text-ink font-medium" to="/login">Log in</RoughLink>
              </p>
            </form>
          )}
        </RoughCard>
      </div>
    </DotGridBackground>
  );
};
