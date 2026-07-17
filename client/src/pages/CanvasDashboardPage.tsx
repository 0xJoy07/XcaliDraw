import { useEffect, useState } from 'react';
import { FilePlus2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { createCanvas, deleteCanvas, listUserCanvases } from '../lib/canvasApi';
import type { CanvasSummary } from '../lib/canvasApi';

import { DotGridBackground } from '../components/ui/DotGridBackground';
import { RoughCard } from '../components/ui/RoughCard';
import { RoughButton } from '../components/ui/RoughButton';
import { RoughDeleteButton } from '../components/ui/RoughDeleteButton';
import { DoodleAnim } from '../components/ui/DoodleAnim';

export const CanvasDashboardPage = () => {
  const { authenticatedFetch, logout, user } = useAuth();
  const navigate = useNavigate();
  const [canvases, setCanvases] = useState<CanvasSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    listUserCanvases(authenticatedFetch)
      .then((response) => {
        if (!cancelled) setCanvases(response.canvases);
      })
      .catch((caught) => {
        if (!cancelled) setError((caught as Error).message || 'Could not load canvases');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authenticatedFetch]);

  const handleCreate = async () => {
    const response = await createCanvas(authenticatedFetch, 'Untitled sketch');
    navigate(`/canvas/${response.canvas.id}`);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteCanvas(authenticatedFetch, id);
    setCanvases((items) => items.filter((canvas) => canvas.id !== id));
  };

  return (
    <DotGridBackground className="">
      <div className="flex min-h-[100dvh] flex-col">
        <header className="flex items-center justify-between px-6 py-6 border-b border-ink/10 bg-paper/50 backdrop-blur-sm sticky top-0 z-20">
          <div>
            <h1 className="text-3xl font-virgil text-ink">Your canvases</h1>
            <p className="mt-1 text-sm font-sans text-ink/70">{user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-36">
              <RoughButton
                onClick={handleCreate}
                variant="primary"
                icon={<FilePlus2 size={18} />}
              >
                New canvas
              </RoughButton>
            </div>
            <div className="w-12">
              <RoughButton
                onClick={async () => {
                  navigate('/');
                  await logout();
                }}
                variant="secondary"
                icon={<LogOut size={18} />}
                title="Log out"
                aria-label="Log out"
              />
            </div>
          </div>
        </header>

        <section className="mx-auto w-full max-w-5xl px-6 py-10 flex-1">
          {loading ? (
            <p className="text-sm font-sans text-ink/70 text-center mt-10">Loading...</p>
          ) : error ? (
            <p className="text-sm font-sans text-red-500 text-center mt-10">{error}</p>
          ) : canvases.length === 0 ? (
            <div className="mt-16 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
              <DoodleAnim />
              <p className="mt-2 text-xl font-virgil text-ink/70">No sketches yet — start your first one.</p>
              <div className="mt-8 w-48">
                <RoughButton
                  onClick={handleCreate}
                  variant="primary"
                  icon={<FilePlus2 size={18} />}
                >
                  New canvas
                </RoughButton>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {canvases.map((canvas) => (
                <article
                  key={canvas.id}
                  className="group relative cursor-pointer outline-none focus-within:ring-2 focus-within:ring-marker-violet rounded-md transition-transform duration-200 motion-safe:hover:-rotate-1 motion-safe:hover:scale-[1.02] motion-reduce:transition-none motion-reduce:transform-none"
                  onClick={() => navigate(`/canvas/${canvas.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`/canvas/${canvas.id}`);
                    }
                  }}
                  tabIndex={0}
                >
                  <RoughCard className="h-full">
                    <div className="flex h-full flex-col justify-between min-h-[80px]">
                      <div>
                        <h2 className="truncate font-virgil text-xl text-ink leading-tight">{canvas.title}</h2>
                        <p className="mt-2 text-xs font-sans text-ink/60 uppercase tracking-wide">
                          Updated {new Date(canvas.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <RoughDeleteButton
                          onClick={(e) => handleDelete(canvas.id, e)}
                        />
                      </div>
                    </div>
                  </RoughCard>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </DotGridBackground>
  );
};
