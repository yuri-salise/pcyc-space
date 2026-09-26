import nodemailer from 'nodemailer';
import { createModuleLogger } from '@/lib/logger';

const log = createModuleLogger('email:mailer');

const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const smtpHost = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

export const transporter = (smtpUser && smtpPassword)
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    })
  : null;

if (transporter) {
  log.info({ host: smtpHost, port: smtpPort }, 'Nodemailer SMTP client initialized successfully');
} else {
  log.warn('SMTP_USER or SMTP_PASSWORD missing. Email dispatch will be simulated.');
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Transactional email sender using Nodemailer + Gmail SMTP.
 * Used for system notifications, welcome emails, and order receipts.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: SendEmailOptions): Promise<SendEmailResult> {
  const from = process.env.EMAIL_FROM || 'PCYC Space <notifications@pcyc.ph>';
  
  // Format 'to' as comma-separated string if it's an array
  const toAddress = Array.isArray(to) ? to.join(', ') : to;

  // Development simulation bypass
  if (!transporter) {
    log.info(
      { to: toAddress, subject },
      '[SIMULATED EMAIL] (SMTP config missing)'
    );
    return { success: true, messageId: `sim-${Date.now()}` };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: toAddress,
      subject,
      html,
      text: text || subject, // Fallback text
      replyTo: replyTo || process.env.EMAIL_REPLY_TO || 'admin@pcyc.ph',
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    log.error({ error: error.message || error, to: toAddress }, 'Failed to send email via SMTP');
    return {
      success: false,
      error: error.message || 'Unknown SMTP error',
    };
  }
}
