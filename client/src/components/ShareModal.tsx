import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { 
  shareCanvas, revokeShare, addCollaborator, listCollaborators, removeCollaborator,
  type Collaborator, type SavedCanvas 
} from '../lib/canvasApi';
import { Link, Copy, X, Trash2, UserPlus, ShieldAlert } from 'lucide-react';
import { useElementsStore } from '../store/elementsStore';
import { RoughCard } from './ui/RoughCard';
import { RoughButton } from './ui/RoughButton';
import { RoughInput } from './ui/RoughInput';
import { RoughSelect } from './ui/RoughSelect';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvas: SavedCanvas | null;
  onCanvasUpdate: (updatedCanvas: SavedCanvas) => void;
  theme: 'light' | 'dark';
}

export const ShareModal = ({ isOpen, onClose, canvas, onCanvasUpdate, theme }: ShareModalProps) => {
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

  const handleUpdateLinkAccess = async (val: string) => {
    try {
      setIsLoading(true);
      let isPublic = false;
      let publicRole: 'viewer' | 'editor' | null = null;
      if (val === 'viewer') { isPublic = true; publicRole = 'viewer'; }
      if (val === 'editor') { isPublic = true; publicRole = 'editor'; }
      
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <div className="theme-adaptive w-full h-full sm:h-auto sm:max-w-xl flex flex-col max-h-[100dvh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out">
        <RoughCard key={theme} className="w-full h-full sm:h-auto flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-virgil flex items-center gap-2">
              <Link size={24} /> Share Canvas
            </h2>
            <button 
              onClick={onClose} 
              className="p-1 rounded-md hover:bg-ui-bg-hover transition-colors absolute right-4 top-4 sm:right-6 sm:top-6"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto space-y-6 flex-1 pr-1">
            
            {/* Link Access */}
            <section className="space-y-3">
              <h3 className="text-xs font-sans font-semibold uppercase tracking-wider opacity-70">General Access</h3>
              
              <div className="flex flex-col gap-3">
                <RoughSelect 
                  key={`general-${theme}`}
                  value={currentLinkValue}
                  onChange={handleUpdateLinkAccess}
                  disabled={isLoading}
                  options={[
                    { value: 'private', label: 'Restricted (Only invited people)' },
                    { value: 'viewer', label: 'Anyone with the link can view' },
                    { value: 'editor', label: 'Anyone with the link can edit' }
                  ]}
                />
                
                {canvas.isPublic && canvas.shareToken && (
                  <div className="flex gap-2">
                    <RoughInput 
                      key={`link-${theme}`}
                      readOnly 
                      value={`${window.location.origin}/canvas/shared/${canvas.shareToken}`}
                      className="opacity-75"
                    />
                    <div className="w-24 shrink-0 mt-1">
                      <RoughButton 
                        key={`copy-${theme}`}
                        onClick={copyLink}
                        variant="primary"
                        icon={<Copy size={16} />}
                      >
                        Copy
                      </RoughButton>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Invite */}
            <section className="space-y-3">
              <h3 className="text-xs font-sans font-semibold uppercase tracking-wider opacity-70">People with access</h3>
              
              <form onSubmit={handleInvite} className="flex gap-2 items-start">
                <div className="flex-1">
                  <RoughInput 
                    key={`email-${theme}`}
                    type="email"
                    placeholder="Invite via email..."
                    required
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="w-32">
                  <RoughSelect
                    key={`role-${theme}`}
                    value={inviteRole}
                    onChange={v => setInviteRole(v as 'viewer' | 'editor')}
                    disabled={isLoading}
                    options={[
                      { value: 'viewer', label: 'Viewer' },
                      { value: 'editor', label: 'Editor' }
                    ]}
                  />
                </div>
                <div className="w-24 mt-1">
                  <RoughButton 
                    key={`invite-${theme}`}
                    onClick={(e) => {
                      if (!inviteEmail.trim()) {
                        e.preventDefault(); // allow form submit to handle valid inputs
                        return;
                      }
                      // handled by form onSubmit
                    }}
                    variant="primary"
                    icon={<UserPlus size={16} />}
                    type="submit"
                    disabled={isLoading || !inviteEmail.trim()}
                  >
                    Add
                  </RoughButton>
                </div>
              </form>

              <div className="space-y-2 mt-4 max-h-60 overflow-y-auto pr-2">
                {/* Owner Row */}
                <div className="flex items-center justify-between p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                      O
                    </div>
                    <div>
                      <p className="text-sm font-sans font-medium">You (Owner)</p>
                    </div>
                  </div>
                  <span className="text-xs font-sans text-ui-fg-muted uppercase font-semibold">Owner</span>
                </div>
                
                {/* Collaborator Rows */}
                {collaborators.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center font-bold">
                          {c.name ? c.name[0].toUpperCase() : c.email[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-sans font-medium truncate max-w-48">{c.name || c.email}</span>
                        <span className="text-xs font-sans opacity-70 truncate max-w-48">{c.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-sans opacity-70 uppercase font-semibold capitalize w-12 text-right">
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
              <section className="pt-4 mt-6">
                <RoughButton 
                  key={`revoke-${theme}`}
                  onClick={handleRevokeAll}
                  disabled={isLoading}
                  variant="secondary"
                  className="!text-red-600 dark:!text-red-400"
                  icon={<ShieldAlert size={16} />}
                >
                  Revoke All Access (Make entirely private)
                </RoughButton>
              </section>
            )}

          </div>
        </RoughCard>
      </div>
    </div>
  );
};
