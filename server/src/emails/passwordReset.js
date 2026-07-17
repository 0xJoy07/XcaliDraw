import { baseTemplate } from './baseTemplate.js';

export const passwordResetEmail = (resetLink) => {
  return baseTemplate({
    previewText: 'Reset your Xcalidraw password',
    bodyHtml: `
      <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 24px; font-weight: normal; color: #1a1a1a; font-family: 'Excalifont', 'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive;">
        Reset your password
      </h2>
      <p style="margin-top: 0; margin-bottom: 24px; color: #374151;">
        We received a request to reset your password. This link expires in 15 minutes.
      </p>
      
      <!-- CTA Button -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
        <tr>
          <td align="center" bgcolor="#f59e0b" style="border-radius: 6px;">
            <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 12px 24px; font-family: 'Excalifont', 'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive; font-size: 18px; font-weight: normal; color: #1a1a1a; text-decoration: none; border-radius: 6px;">
              Reset Password
            </a>
          </td>
        </tr>
      </table>
      
      <!-- Fallback plain text URL -->
      <p style="margin-top: 0; margin-bottom: 32px; font-size: 14px; color: #6b7280; word-break: break-all;">
        Or copy and paste this URL into your browser:<br>
        <a href="${resetLink}" style="color: #6366f1; text-decoration: underline;">${resetLink}</a>
      </p>
      
      <!-- Footer Note -->
      <p style="margin: 0; font-size: 13px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px;">
        If you didn't request this, you can safely ignore this email — your password will not be changed.
      </p>
    `,
  });
};
