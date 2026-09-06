import { z } from 'zod';

import { PRICING_TYPES } from '../utils/pricing';

const metres = z.coerce
  .number({ invalid_type_error: 'Enter a measurement in metres' })
  .positive('Must be greater than 0')
  .max(50, 'That looks too large for a window');

const naira = z.coerce
  .number({ invalid_type_error: 'Enter an amount' })
  .nonnegative('Cannot be negative')
  .max(100_000_000, 'That amount looks wrong');

const pieces = z.coerce
  .number({ invalid_type_error: 'Enter a quantity' })
  .positive('Must be at least 1')
  .max(10_000, 'That quantity looks wrong');

/**
 * A line is only valid against the fields its pricing type actually uses: blinds must
 * carry width and height, everything else must carry a quantity.
 */
export const previewLineSchema = z
  .object({
    pricingType: z.enum(PRICING_TYPES),
    unitPrice: naira,
    width: metres.optional(),
    height: metres.optional(),
    quantity: pieces.optional(),
  })
  .superRefine((line, ctx) => {
    if (line.pricingType === 'PER_M2') {
      if (line.width === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['width'],
          message: 'Width is required for products priced per m²',
        });
      }

      if (line.height === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['height'],
          message: 'Height is required for products priced per m²',
        });
      }

      return;
    }

    if (line.quantity === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['quantity'],
        message: 'Quantity is required for this product',
      });
    }
  });

export type PreviewLineInput = z.infer<typeof previewLineSchema>;
