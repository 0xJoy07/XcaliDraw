import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { 
  shareCanvas, revokeShare, addCollaborator, listCollaborators, removeCollaborator,
  type Collaborator, type SavedCanvas 
} from '../lib/canvasApi';
import { Link, Copy, X, Trash2, UserPlus, ShieldAlert } from 'lucide-react';
import { useElementsStore } from '../store/elementsStore';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvas: SavedCanvas | null;
  onCanvasUpdate: (updatedCanvas: SavedCanvas) => void;
}

export const ShareModal = ({ isOpen, onClose, canvas, onCanvasUpdate }: ShareModalProps) => {
  const { authenticatedFetch } = useAuth();
  const addToast = useElementsStore((state) => state.addToast);
  
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('viewer');

  useEffect(() => {
    if (isOpen && canvas?.id) {
      loadCollaborators();
    }
  }, [isOpen, canvas?.id]);

  if (!isOpen || !canvas) return null;

  const loadCollaborators = async () => {
    try {
      setIsLoading(true);
      const res = await listCollaborators(authenticatedFetch, canvas.id);
      setCollaborators(res.collaborators);
    } catch (err: any) {
      addToast(err.message || 'Failed to load collaborators', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLinkAccess = async (isPublic: boolean, publicRole: 'viewer' | 'editor' | null) => {
    try {
      setIsLoading(true);
      const res = await shareCanvas(authenticatedFetch, canvas.id, { isPublic, publicRole });
      onCanvasUpdate(res.canvas);
      addToast('Link sharing updated', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update sharing', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeAll = async () => {
    if (!window.confirm('Are you sure? This will disable the public link and remove all collaborators immediately.')) return;
    try {
      setIsLoading(true);
      const res = await revokeShare(authenticatedFetch, canvas.id);
      onCanvasUpdate(res.canvas);
      setCollaborators([]);
      addToast('Sharing revoked', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to revoke sharing', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    
    try {
      setIsLoading(true);
      const res = await addCollaborator(authenticatedFetch, canvas.id, { email: inviteEmail.trim(), role: inviteRole });
      
      setCollaborators((prev) => {
        const existingIdx = prev.findIndex(c => c.id === res.collaborator.id);
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = res.collaborator;
          return next;
        }
        return [...prev, res.collaborator];
      });
      
      setInviteEmail('');
      addToast('Collaborator added', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to invite collaborator', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    try {
      setIsLoading(true);
      await removeCollaborator(authenticatedFetch, canvas.id, userId);
      setCollaborators((prev) => prev.filter(c => c.id !== userId));
      addToast('Collaborator removed', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to remove collaborator', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = () => {
    if (!canvas.shareToken) return;
    const url = `${window.location.origin}/canvas/shared/${canvas.shareToken}`;
    navigator.clipboard.writeText(url);
    addToast('Link copied to clipboard', 'success');
  };

  const currentLinkValue = canvas.isPublic ? (canvas.publicRole || 'viewer') : 'private';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4">
      <div className="w-full h-full sm:h-auto sm:max-w-lg bg-ui-bg text-ui-fg rounded-none sm:rounded-xl shadow-2xl overflow-hidden border border-ui-border flex flex-col max-h-[100dvh] sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ui-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Link size={20} /> Share Canvas
          </h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-ui-bg-hover transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-6">
          
          {/* Link Access */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ui-fg-muted">General Access</h3>
            
            <div className="flex flex-col gap-2 p-3 bg-ui-bg-hover rounded-lg border border-ui-border">
              <select 
                className="w-full bg-ui-bg border border-ui-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                value={currentLinkValue}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'private') handleUpdateLinkAccess(false, null);
                  else if (val === 'viewer') handleUpdateLinkAccess(true, 'viewer');
                  else if (val === 'editor') handleUpdateLinkAccess(true, 'editor');
                }}
                disabled={isLoading}
              >
                <option value="private">Restricted (Only invited people)</option>
                <option value="viewer">Anyone with the link can view</option>
                <option value="editor">Anyone with the link can edit</option>
              </select>
              
              {canvas.isPublic && canvas.shareToken && (
                <div className="flex gap-2 mt-2">
                  <input 
                    readOnly 
                    value={`${window.location.origin}/canvas/shared/${canvas.shareToken}`}
                    className="flex-1 bg-ui-bg text-sm border border-ui-border rounded-md px-3 py-1.5 opacity-75 truncate"
                  />
                  <button 
                    onClick={copyLink}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors shrink-0"
                  >
                    <Copy size={16} /> Copy
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Invite */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ui-fg-muted">People with access</h3>
            
            <form onSubmit={handleInvite} className="flex gap-2">
              <input 
                type="email"
                placeholder="Invite via email..."
                required
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                disabled={isLoading}
                className="flex-1 bg-ui-bg border border-ui-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as 'viewer' | 'editor')}
                disabled={isLoading}
                className="w-24 bg-ui-bg border border-ui-border rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <button 
                type="submit"
                disabled={isLoading || !inviteEmail.trim()}
                className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <UserPlus size={16} /> Add
              </button>
            </form>

            <div className="space-y-2 mt-4 max-h-60 overflow-y-auto pr-1">
              {/* Owner Row */}
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-ui-bg-hover">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    O
                  </div>
                  <div>
                    <p className="text-sm font-medium">You (Owner)</p>
                  </div>
                </div>
                <span className="text-xs text-ui-fg-muted uppercase font-semibold">Owner</span>
              </div>
              
              {/* Collaborator Rows */}
              {collaborators.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-md hover:bg-ui-bg-hover">
                  <div className="flex items-center gap-3">
                    {c.avatarUrl ? (
                      <img src={c.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold">
                        {c.name ? c.name[0].toUpperCase() : c.email[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium truncate max-w-48">{c.name || c.email}</span>
                      <span className="text-xs text-ui-fg-muted truncate max-w-48">{c.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ui-fg-muted uppercase font-semibold capitalize w-12 text-right">
                      {c.role}
                    </span>
                    <button 
                      onClick={() => handleRemoveCollaborator(c.id)}
                      disabled={isLoading}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors disabled:opacity-50"
                      title="Remove access"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Danger Zone */}
          {(canvas.isPublic || collaborators.length > 0) && (
            <section className="pt-4 border-t border-red-500/20">
               <button 
                onClick={handleRevokeAll}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-medium rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
              >
                <ShieldAlert size={16} /> Revoke All Access (Make entirely private)
              </button>
            </section>
          )}

        </div>
      </div>
    </div>
  );
};
