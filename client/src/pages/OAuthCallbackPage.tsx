import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const OAuthCallbackPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user) {
      navigate('/', { replace: true });
    } else {
      navigate('/login?error=oauth_failed', { replace: true });
    }
  }, [loading, user, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas-bg text-ui-fg">
      {loading ? 'Finishing sign in...' : 'Redirecting...'}
    </main>
  );
};
