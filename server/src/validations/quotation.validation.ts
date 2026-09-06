import { z } from 'zod';

import { customerBodySchema } from './customer.validation';
import { invoiceItemBodySchema } from './invoice.validation';

const naira = z.coerce
  .number({ invalid_type_error: 'Enter an amount' })
  .int('Use whole Naira')
  .nonnegative('Cannot be negative')
  .max(100_000_000, 'That amount looks wrong');

export const quotationBodySchema = z
  .object({
    customerId: z.string().uuid('Unknown client').optional(),
    customer: customerBodySchema.optional(),
    discount: naira.default(0),
    items: z.array(invoiceItemBodySchema).min(1, 'Add at least one item'),
  })
  .superRefine((body, ctx) => {
    if (!body.customerId && !body.customer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customerId'],
        message: 'Choose a client or add a new one',
      });
    }
  });

export type QuotationBody = z.infer<typeof quotationBodySchema>;

export const quotationIdParamsSchema = z.object({
  id: z.string().uuid('Unknown quotation'),
});

export const QUOTATION_LIST_FILTERS = ['all', 'open', 'converted', 'cancelled'] as const;

export type QuotationListFilter = (typeof QUOTATION_LIST_FILTERS)[number];

export const quotationListQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(QUOTATION_LIST_FILTERS).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export type QuotationListQuery = z.infer<typeof quotationListQuerySchema>;

export const quotationTokenParamsSchema = z.object({
  token: z.string().trim().min(16, 'Unknown quotation').max(80, 'Unknown quotation'),
});
