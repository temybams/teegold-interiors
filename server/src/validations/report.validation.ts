import { z } from 'zod';

const dateOnly = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .transform((value) => new Date(`${value}T00:00:00`));

export const reportQuerySchema = z
  .object({
    from: dateOnly,
    to: dateOnly,
  })
  .superRefine((query, ctx) => {
    if (query.from > query.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['from'],
        message: 'From date must be on or before the to date',
      });
    }
  });

export type ReportQuery = z.infer<typeof reportQuerySchema>;
