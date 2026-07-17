import nodemailer from 'nodemailer';

import { requireEnv } from '../utils/env.js';

const user = requireEnv('GMAIL_USER');
const clientId = requireEnv('GOOGLE_CLIENT_ID');
const clientSecret = requireEnv('GOOGLE_CLIENT_SECRET');
const refreshToken = requireEnv('GMAIL_REFRESH_TOKEN');
const accessToken = process.env.GMAIL_ACCESS_TOKEN || ''; // Not required if refresh token is present
const fromName = requireEnv('MAIL_FROM_NAME');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user,
    clientId,
    clientSecret,
    refreshToken,
    accessToken,
  },
});

// Verify connection configuration on startup
export const verifyMailer = async () => {
  if (!user || !clientId || !clientSecret || !refreshToken) {
    console.warn('⚠️ Mailer configuration is missing required environment variables for OAuth2. Emails will not be sent.');
    return;
  }
  try {
    await transporter.verify();
    console.log('✅ Mailer is ready to send messages via Gmail OAuth2');
  } catch (error) {
    console.error('❌ Mailer initialization failed. Invalid credentials or network error:');
    console.error(error);
  }
};



export const sendMail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`✉️ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`);
    console.error(error);
    return { success: false, error };
  }
};
