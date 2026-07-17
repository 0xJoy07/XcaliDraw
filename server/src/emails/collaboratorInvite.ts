import { baseTemplate } from './baseTemplate.js';

interface CollaboratorInviteProps {
  ownerName: string;
  canvasTitle: string;
  role: 'viewer' | 'editor';
  canvasLink: string;
}

export const collaboratorInviteEmail = ({ ownerName, canvasTitle, role, canvasLink }: CollaboratorInviteProps): string => {
  return baseTemplate({
    previewText: `${ownerName} shared a canvas with you on Xcalidraw`,
    bodyHtml: `
      <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 24px; font-weight: normal; color: #1a1a1a; font-family: 'Excalifont', 'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive;">
        You've been invited to a canvas
      </h2>
      <p style="margin-top: 0; margin-bottom: 16px; color: #374151;">
        <strong>${ownerName}</strong> gave you ${role} access to <strong>'${canvasTitle}'</strong>.
      </p>
      ${role === 'viewer' ? `
        <p style="margin-top: 0; margin-bottom: 24px; font-size: 14px; color: #6b7280;">
          You can view this canvas but not edit it.
        </p>
      ` : ''}
      
      <!-- CTA Button -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; ${role === 'editor' ? 'margin-top: 8px;' : ''}">
        <tr>
          <td align="center" bgcolor="#f59e0b" style="border-radius: 6px;">
            <a href="${canvasLink}" target="_blank" style="display: inline-block; padding: 12px 24px; font-family: 'Excalifont', 'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive; font-size: 18px; font-weight: normal; color: #1a1a1a; text-decoration: none; border-radius: 6px;">
              Open canvas
            </a>
          </td>
        </tr>
      </table>
    `,
  });
};
