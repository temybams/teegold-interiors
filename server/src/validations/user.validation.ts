import { z } from 'zod';

/** No password here: the invited person chooses their own. */
export const inviteUserSchema = z.object({
  name: z.string().trim().min(2, 'Enter the full name'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  role: z.enum(['ADMIN', 'STAFF']).default('STAFF'),
});

export type InviteUserBody = z.infer<typeof inviteUserSchema>;

export const userIdParamsSchema = z.object({
  id: z.string().uuid('Unknown user'),
});

/** PENDING is not settable by hand — only inviting someone produces it. */
export const setUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED'], {
    required_error: 'Choose active or suspended',
  }),
});

export type SetUserStatusBody = z.infer<typeof setUserStatusSchema>;
