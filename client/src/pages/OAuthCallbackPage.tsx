import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const OAuthCallbackPage = () => {
  const { user, loading, exchangeToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token && !attempted.current) {
      attempted.current = true;
      exchangeToken(token)
        .then(() => {
          navigate('/', { replace: true });
        })
        .catch((err) => {
          console.error('OAuth exchange failed:', err);
          setExchangeError(err.message || 'Unknown error');
        });
      return;
    }

    if (!token && !loading) {
      if (user) {
        navigate('/', { replace: true });
      } else {
        navigate('/login?error=oauth_failed', { replace: true });
      }
    }
  }, [loading, user, navigate, searchParams, exchangeToken]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas-bg text-ui-fg">
      {exchangeError ? (
        <div className="text-red-500">Sign in failed: {exchangeError}</div>
      ) : loading || searchParams.has('token') ? (
        'Finishing sign in...'
      ) : (
        'Redirecting...'
      )}
    </main>
  );
};
