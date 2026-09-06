import { z } from 'zod';

export const customerBodySchema = z.object({
  name: z.string().trim().min(2, 'Enter the client name'),
  phone: z
    .string()
    .trim()
    .min(10, 'Enter a phone number')
    .max(20, 'That phone number looks too long'),
  address: z.string().trim().min(3, 'Enter an address or area'),
});

export type CustomerBody = z.infer<typeof customerBodySchema>;

export const customerIdParamsSchema = z.object({
  id: z.string().uuid('Unknown client'),
});

export const customerListQuerySchema = z.object({
  q: z.string().trim().optional(),
});
