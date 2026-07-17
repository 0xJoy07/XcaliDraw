import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../lib/authApi';
import type { ApiError } from '../lib/authApi';
import { DotGridBackground } from '../components/ui/DotGridBackground';
import { RoughCard } from '../components/ui/RoughCard';
import { RoughInput } from '../components/ui/RoughInput';
import { RoughButton } from '../components/ui/RoughButton';
import { RoughLink } from '../components/ui/RoughLink';
import { DoodleAnim } from '../components/ui/DoodleAnim';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // State 1: No Token
  if (!token) {
    return (
      <DotGridBackground>
        <div className="w-full max-w-sm">
          <DoodleAnim />
          <RoughCard>
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-virgil text-ink">Invalid link</h1>
              <p className="mt-2 text-sm font-sans text-red-500">
                No reset token provided.
              </p>
            </div>
            <div className="text-center mt-6">
              <RoughLink className="text-sm font-sans font-medium text-ink hover:text-ink/70" to="/forgot-password">
                Request a new link
              </RoughLink>
            </div>
          </RoughCard>
        </div>
      </DotGridBackground>
    );
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Fallback manual check in case HTML5 minLength is bypassed
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);

    try {
      await authApi.resetPassword({ token, newPassword: password });
      setSuccess(true);
    } catch (caught) {
      setError((caught as ApiError).message || 'Failed to reset password');
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
            <h1 className="text-3xl font-virgil text-ink">Choose a new password</h1>
          </div>

          {/* State 3: Success */}
          {success ? (
            <div className="space-y-6">
              <div className="rounded-md border-2 border-green-500 bg-green-50 p-4">
                <p className="text-sm font-sans font-medium text-green-800">
                  Your password has been successfully reset.
                </p>
              </div>
              <div className="pt-2">
                <RoughButton type="button" onClick={() => navigate('/login', { replace: true })}>
                  Continue to log in
                </RoughButton>
              </div>
            </div>
          ) : (
            /* State 2 & 4: Form & Error */
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm font-sans font-medium text-ink">New Password</span>
                <RoughInput
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <span className="text-xs font-sans text-ink/50 mt-1 block">
                  Must be at least 8 characters
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-sans font-medium text-ink">Confirm Password</span>
                <RoughInput
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>

              {error && (
                <div className="space-y-2">
                  <p className="text-sm font-sans text-red-500">{error}</p>
                  <RoughLink className="text-xs font-sans font-medium text-ink/70 hover:text-ink" to="/forgot-password">
                    Need a new link? Request another reset
                  </RoughLink>
                </div>
              )}

              <div className="pt-4">
                <RoughButton type="submit" disabled={submitting}>
                  {submitting ? 'Resetting...' : 'Reset password'}
                </RoughButton>
              </div>
            </form>
          )}
        </RoughCard>
      </div>
    </DotGridBackground>
  );
};
