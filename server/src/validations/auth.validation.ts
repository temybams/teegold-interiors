import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  // Deliberately no length rule here: an existing password should never be
  // rejected by the login form, only by the check against the stored hash.
  password: z.string().min(1, 'Enter your password'),
});

export type LoginBody = z.infer<typeof loginSchema>;
