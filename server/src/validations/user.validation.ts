import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Enter the full name'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters'),
  role: z.enum(['ADMIN', 'STAFF']).default('STAFF'),
});

export type CreateUserBody = z.infer<typeof createUserSchema>;

export const userIdParamsSchema = z.object({
  id: z.string().uuid('Unknown user'),
});

export const setUserStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'Choose active or inactive' }),
});
