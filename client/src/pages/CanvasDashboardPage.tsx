import { useEffect, useState } from 'react';
import { FilePlus2, LogOut, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { createCanvas, deleteCanvas, listUserCanvases } from '../lib/canvasApi';
import type { CanvasSummary } from '../lib/canvasApi';

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
    const response = await createCanvas(authenticatedFetch, 'Untitled');
    navigate(`/canvas/${response.canvas.id}`);
  };

  const handleDelete = async (id: string) => {
    await deleteCanvas(authenticatedFetch, id);
    setCanvases((items) => items.filter((canvas) => canvas.id !== id));
  };

  return (
    <main className="min-h-screen bg-canvas-bg text-ui-fg">
      <header className="flex items-center justify-between border-b border-ui-border bg-ui-bg px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">Your canvases</h1>
          <p className="text-sm text-ui-fg-muted">{user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-md bg-ui-fg px-3 py-2 text-sm font-medium text-ui-bg hover:opacity-90"
          >
            <FilePlus2 size={16} />
            New canvas
          </button>
          <button
            onClick={logout}
            className="rounded-md border border-ui-border p-2 hover:bg-ui-bg-hover"
            title="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-8">
        {loading ? (
          <p className="text-sm text-ui-fg-muted">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : canvases.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center border border-dashed border-ui-border bg-ui-bg p-8 text-center">
            <p className="font-medium">No canvases yet</p>
            <p className="mt-1 text-sm text-ui-fg-muted">Create one to start drawing.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {canvases.map((canvas) => (
              <article
                key={canvas.id}
                className="border border-ui-border bg-ui-bg p-4 shadow-sm"
              >
                <button
                  onClick={() => navigate(`/canvas/${canvas.id}`)}
                  className="block w-full text-left"
                >
                  <h2 className="truncate font-medium">{canvas.title}</h2>
                  <p className="mt-2 text-sm text-ui-fg-muted">
                    Updated {new Date(canvas.updatedAt).toLocaleString()}
                  </p>
                </button>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleDelete(canvas.id)}
                    className="rounded-md p-2 text-ui-fg-muted hover:bg-ui-bg-hover hover:text-red-500"
                    title="Delete canvas"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};
