// server/utils/sendgrid.js
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Initializes and returns the SendGrid client.
 * Expects SENDGRID_API_KEY and EMAIL_FROM (sender) in process.env.
 */

const API_KEY = (process.env.SENDGRID_API_KEY || process.env.EMAIL_PASS || '').trim();
const FROM = (process.env.EMAIL_FROM || 'no-reply@yourdomain.com').replace(/^"|"$/g, '').trim();

if (!API_KEY) {
  // Throwing early helps you detect missing config during startup.
  throw new Error('SendGrid API key missing. Please set SENDGRID_API_KEY in .env');
}

sgMail.setApiKey(API_KEY);

/**
 * sendGrid({ to, subject, text, html })
 * - to: string or array of recipient emails
 * - subject: string
 * - text: plain text body
 * - html: html body (optional)
 *
 * Returns the promise from @sendgrid/mail
 */
export async function sendGrid({ to, subject, text, html }) {
  if (!to) throw new Error('Missing `to` for sendGrid');
  const msg = {
    to,
    from: FROM,
    subject: subject || '(no subject)',
    text: text || '',
    html: html || undefined,
  };

  // @sendgrid/mail returns a Promise that resolves to an array of responses.
  return sgMail.send(msg);
}

export default sendGrid;
