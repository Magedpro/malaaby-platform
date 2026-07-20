import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// ─── Priority: Gmail SMTP → Resend → Console Simulation ───────────────────

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Cache transporter so we don't recreate it on every call
let gmailTransporter: nodemailer.Transporter | null = null;

function getGmailTransporter(): nodemailer.Transporter | null {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return null;
  if (gmailTransporter) return gmailTransporter;

  gmailTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // TLS
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD, // Gmail App Password (not your regular password)
    },
  });

  return gmailTransporter;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  // 1. Try Gmail SMTP first (sends to ANY email — no domain restrictions)
  const gmail = getGmailTransporter();
  if (gmail) {
    try {
      const info = await gmail.sendMail({
        from: `"منصة ملعبي ⚽" <${GMAIL_USER}>`,
        to,
        subject,
        html,
      });
      console.log('[Email/Gmail] Sent successfully. MessageId:', info.messageId);
      return { success: true, provider: 'gmail' };
    } catch (err) {
      console.error('[Email/Gmail] Failed to send, trying next provider:', err);
    }
  }

  // 2. Fallback: Try Resend (works only for verified domain/email)
  if (RESEND_API_KEY) {
    try {
      const resend = new Resend(RESEND_API_KEY);
      const data = await resend.emails.send({
        from: 'Malaaby Platform <onboarding@resend.dev>',
        to,
        subject,
        html,
      });
      console.log('[Email/Resend] Sent successfully:', data);
      return { success: true, provider: 'resend' };
    } catch (err) {
      console.error('[Email/Resend] Failed to send:', err);
    }
  }

  // 3. Final fallback: Log to console (for local testing without config)
  console.log('\n┌───────────────── 📧 EMAIL (SIMULATED — No SMTP configured) ───────');
  console.log(`│ To:      ${to}`);
  console.log(`│ Subject: ${subject}`);
  const plainText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  console.log(`│ Body:    ${plainText.substring(0, 200)}...`);
  console.log('└────────────────────────────────────────────────────────────────\n');
  console.log('💡 To enable real email: Add GMAIL_USER + GMAIL_APP_PASSWORD to .env.local');
  return { success: true, simulated: true };
}
