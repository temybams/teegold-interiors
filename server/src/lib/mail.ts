import nodemailer from 'nodemailer';

import { env, isMailConfigured } from '../config/env';

type Mail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: { filename: string; content: Buffer; contentType: string }[];
};

const transporter = isMailConfigured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  : null;

/**
 * Returns whether a real inbox received the message. When SMTP is not set we
 * print the mail to the server log so local development still works.
 */
export const sendMail = async (mail: Mail): Promise<boolean> => {
  if (!transporter) {
    console.warn('[mail] SMTP is not configured. Message was not sent.');
    console.warn(`[mail] To: ${mail.to}`);
    console.warn(`[mail] Subject: ${mail.subject}`);
    console.warn(mail.text);
    return false;
  }

  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    attachments: mail.attachments,
  });

  return true;
};

export const inviteEmail = (input: { name: string; inviteUrl: string; invitedBy: string }) => {
  const first = input.name.split(' ')[0] ?? input.name;
  const text = [
    `Hello ${first},`,
    '',
    `${input.invitedBy} has invited you to Teegold Interiors.`,
    'Open this link and choose your own password. That is the only confirmation — there is no extra step.',
    '',
    input.inviteUrl,
    '',
    'The link expires in 7 days and can only be used once.',
    '',
    'Teegold Interiors',
  ].join('\n');

  return {
    subject: 'Your Teegold Interiors invite',
    text,
    html: `<p>Hello ${first},</p>
<p>${input.invitedBy} has invited you to Teegold Interiors.</p>
<p>Open this link and choose your own password. That is the only confirmation — there is no extra step.</p>
<p><a href="${input.inviteUrl}">${input.inviteUrl}</a></p>
<p>The link expires in 7 days and can only be used once.</p>
<p>Teegold Interiors</p>`,
  };
};

export const resetEmail = (input: { name: string; resetUrl: string }) => {
  const first = input.name.split(' ')[0] ?? input.name;
  const text = [
    `Hello ${first},`,
    '',
    'We received a request to reset your Teegold Interiors password.',
    'Open this link to choose a new one. If you did not ask for this, ignore the email.',
    '',
    input.resetUrl,
    '',
    'The link expires in 1 hour.',
    '',
    'Teegold Interiors',
  ].join('\n');

  return {
    subject: 'Reset your Teegold Interiors password',
    text,
    html: `<p>Hello ${first},</p>
<p>We received a request to reset your Teegold Interiors password.</p>
<p>Open this link to choose a new one. If you did not ask for this, ignore the email.</p>
<p><a href="${input.resetUrl}">${input.resetUrl}</a></p>
<p>The link expires in 1 hour.</p>
<p>Teegold Interiors</p>`,
  };
};

export const invoiceEmail = (input: {
  customerName: string;
  number: string;
  totalLabel: string;
  url: string;
}) => {
  const text = [
    `Hello ${input.customerName},`,
    '',
    `Please find your Teegold Interiors invoice ${input.number}. Total: ${input.totalLabel}.`,
    'A PDF is attached. You can also open it here:',
    '',
    input.url,
    '',
    'Teegold Interiors',
  ].join('\n');

  return {
    subject: `Teegold Interiors invoice ${input.number}`,
    text,
    html: `<p>Hello ${input.customerName},</p>
<p>Please find your Teegold Interiors invoice ${input.number}. Total: ${input.totalLabel}.</p>
<p>A PDF is attached. You can also <a href="${input.url}">open it here</a>.</p>
<p>Teegold Interiors</p>`,
  };
};
