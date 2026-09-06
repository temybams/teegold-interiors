import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

export type LoginBody = z.infer<typeof loginSchema>;

const inviteToken = z.string().trim().min(20, 'This invite link is not valid');

export const inviteTokenParamsSchema = z.object({
  token: inviteToken,
});

export const acceptInviteSchema = z.object({
  token: inviteToken,
  password: z.string().min(8, 'Use at least 8 characters'),
});

export type AcceptInviteBody = z.infer<typeof acceptInviteSchema>;

export const requestResetSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

export type RequestResetBody = z.infer<typeof requestResetSchema>;

export const resetPasswordSchema = z.object({
  token: inviteToken,
  password: z.string().min(8, 'Use at least 8 characters'),
});

export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;
