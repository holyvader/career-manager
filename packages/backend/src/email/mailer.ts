import { SMTPClient } from 'emailjs';
import { mailLogger } from '../tools/logger';

const client = new SMTPClient({
  host: process.env.SMTP_HOST || 'localhost',
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 1025,
  user: process.env.SMTP_USER || undefined,
  password: process.env.SMTP_PASSWORD || undefined,
  ssl: process.env.SMTP_SSL === 'true',
  tls: process.env.SMTP_TLS === 'true',
});

const from =
  process.env.SMTP_FROM || 'Career Manager <no-reply@career-manager.local>';

interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Uses emailjs's promise-based `sendAsync` (backed by non-blocking socket I/O)
// so a slow SMTP round-trip never ties up the event loop.
export async function sendMail({
  to,
  subject,
  text,
  html,
}: SendMailInput): Promise<void> {
  try {
    await client.sendAsync({
      from,
      to,
      subject,
      text,
      attachment: [{ data: html, alternative: true }],
    });
    mailLogger.info({ to, subject }, 'Email sent');
  } catch (error) {
    mailLogger.error({ err: error, to, subject }, 'Failed to send email');
    throw error;
  }
}
