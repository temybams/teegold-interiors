import { z } from 'zod';

import { customerBodySchema } from './customer.validation';

const metres = z.coerce
  .number({ invalid_type_error: 'Enter a measurement in metres' })
  .positive('Must be greater than 0')
  .max(50, 'That looks too large for a window');

const pieces = z.coerce
  .number({ invalid_type_error: 'Enter a quantity' })
  .positive('Must be at least 1')
  .max(10_000, 'That quantity looks wrong');

const naira = z.coerce
  .number({ invalid_type_error: 'Enter an amount' })
  .int('Use whole Naira')
  .nonnegative('Cannot be negative')
  .max(100_000_000, 'That amount looks wrong');

/**
 * Pricing type is not on the request — the product on file decides whether
 * width/height or quantity is required. The service fills that in.
 */
export const invoiceItemBodySchema = z.object({
  productId: z.string().uuid('Choose a product'),
  width: metres.optional(),
  height: metres.optional(),
  quantity: pieces.optional(),
});

export const invoiceBodySchema = z
  .object({
    customerId: z.string().uuid('Unknown client').optional(),
    customer: customerBodySchema.optional(),
    discount: naira.default(0),
    paid: z.boolean().optional().default(false),
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

export type InvoiceBody = z.infer<typeof invoiceBodySchema>;

export const invoiceIdParamsSchema = z.object({
  id: z.string().uuid('Unknown invoice'),
});

export const INVOICE_LIST_FILTERS = ['all', 'paid', 'pending', 'cancelled'] as const;

export type InvoiceListFilter = (typeof INVOICE_LIST_FILTERS)[number];

export const invoiceListQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(INVOICE_LIST_FILTERS).optional().default('all'),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export type InvoiceListQuery = z.infer<typeof invoiceListQuerySchema>;

export const invoiceTokenParamsSchema = z.object({
  token: z.string().trim().min(16, 'Unknown invoice').max(80, 'Unknown invoice'),
});

export const invoiceEmailBodySchema = z.object({
  email: z.string().trim().email('Enter an email address').toLowerCase(),
});

export type InvoiceEmailBody = z.infer<typeof invoiceEmailBodySchema>;

export const invoicePaymentBodySchema = z.object({
  /** This payment only — added to what is already paid. Cannot exceed the balance. */
  payment: z.coerce
    .number({ invalid_type_error: 'Enter how much was paid' })
    .int('Use whole Naira')
    .positive('Enter an amount greater than zero')
    .max(100_000_000, 'That amount looks wrong'),
});

export type InvoicePaymentBody = z.infer<typeof invoicePaymentBodySchema>;
