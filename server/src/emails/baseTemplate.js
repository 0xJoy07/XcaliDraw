

import { requireEnv } from '../utils/env.js';

export const baseTemplate = ({ previewText, bodyHtml }) => {
  const clientUrl = requireEnv('CLIENT_URL');
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Xcalidraw</title>
  <style>
    @font-face {
      font-family: 'Excalifont';
      src: url('${clientUrl}/fonts/Excalifont-Regular.woff') format('woff');
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Hidden preview text -->
  <div style="display: none; max-height: 0px; overflow: hidden;">
    ${previewText}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 30px 40px; background-color: #ffffff; border-bottom: 1px solid #f0f0f0;">
              <div style="margin: 0; font-size: 28px; font-weight: normal; color: #1a1a1a; letter-spacing: -0.5px; font-family: 'Excalifont', 'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive;">
                <span style="color: #6366f1;">Xcali</span>draw
              </div>
            </td>
          </tr>

          <!-- Body content -->
          <tr>
            <td style="padding: 40px; font-size: 16px; line-height: 1.6; color: #374151;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #f0f0f0;">
              <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                &copy; ${new Date().getFullYear()} Xcalidraw. All rights reserved.
                <br>
                This is an automated message, please do not reply.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};
