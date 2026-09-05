import { PRODUCT_CATEGORIES, PRICING_TYPES } from '@teegold/shared';
import { z } from 'zod';

export const productBodySchema = z.object({
  name: z.string().trim().min(2, 'Enter the product name'),
  category: z.enum(PRODUCT_CATEGORIES, { required_error: 'Choose a category' }),
  pricingType: z.enum(PRICING_TYPES, { required_error: 'Choose how this is priced' }),
  unitPrice: z.coerce
    .number({ invalid_type_error: 'Enter a price' })
    .int('Use whole Naira')
    .positive('Must be greater than 0')
    .max(100_000_000, 'That price looks wrong'),
  active: z.boolean().optional(),
});

export type ProductBody = z.infer<typeof productBodySchema>;

export const productIdParamsSchema = z.object({
  id: z.string().uuid('Unknown product'),
});

export const productListQuerySchema = z.object({
  q: z.string().trim().optional(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  active: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

export const setProductActiveSchema = z.object({
  active: z.boolean({ required_error: 'Choose active or disabled' }),
});

export type SetProductActiveBody = z.infer<typeof setProductActiveSchema>;
