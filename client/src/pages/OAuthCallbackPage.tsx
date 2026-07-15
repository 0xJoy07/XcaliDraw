import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const OAuthCallbackPage = () => {
  const { refreshSession } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshSession()
      .then((token) => {
        navigate(token ? '/' : '/login', { replace: true });
      });
  }, [navigate, refreshSession]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas-bg text-ui-fg">
      Finishing sign in...
    </main>
  );
};
