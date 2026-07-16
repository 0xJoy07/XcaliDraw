import { CanvasCollaborator } from '../models/CanvasCollaborator.js';

/**
 * Resolves the access role for a user on a given canvas.
 * Order of precedence (highest wins):
 * 1. Owner
 * 2. Explicit collaborator role (editor > viewer)
 * 3. Public link role (editor > viewer)
 * 4. None
 * 
 * @param {Object} params
 * @param {Object} params.canvas - The canvas document
 * @param {string} [params.userId] - The requesting user's ID
 * @returns {Promise<'owner' | 'editor' | 'viewer' | 'none'>}
 */
export const resolveAccess = async ({ canvas, userId }) => {
  // 1. Owner check
  if (userId && canvas.userId.toString() === userId) {
    return 'owner';
  }

  // 2. Collaborator check
  if (userId) {
    const collabo = await CanvasCollaborator.findOne({ canvasId: canvas._id, userId });
    if (collabo) {
      return collabo.role;
    }
  }

  // 3. Public link check
  if (canvas.isPublic) {
    if (canvas.publicRole === 'editor') return 'editor';
    if (canvas.publicRole === 'viewer') return 'viewer';
  }

  // 4. Fallback
  return 'none';
};
