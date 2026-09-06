import { z } from 'zod';

export const categoryBodySchema = z.object({
  name: z.string().trim().min(2, 'Enter a category name').max(60, 'Keep it shorter'),
});

export type CategoryBody = z.infer<typeof categoryBodySchema>;

export const categoryUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Enter a category name').max(60, 'Keep it shorter').optional(),
  active: z.boolean().optional(),
});

export type CategoryUpdateBody = z.infer<typeof categoryUpdateSchema>;

export const categoryIdParamsSchema = z.object({
  id: z.string().uuid('Unknown category'),
});

export const categoryListQuerySchema = z.object({
  active: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
});

export type CategoryListQuery = z.infer<typeof categoryListQuerySchema>;
