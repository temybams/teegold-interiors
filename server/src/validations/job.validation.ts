import { z } from 'zod';

export const JOB_STATUSES = ['NOT_STARTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] as const;

export const jobStatusBodySchema = z.object({
  jobStatus: z.enum(JOB_STATUSES, { required_error: 'Choose a job status' }),
  scheduledAt: z
    .union([z.string().min(1), z.null()])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }

      if (value === null || value === '') {
        return null;
      }

      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }),
});

export type JobStatusBody = z.infer<typeof jobStatusBodySchema>;

export const JOB_LIST_FILTERS = ['all', 'NOT_STARTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] as const;

export const jobListQuerySchema = z.object({
  status: z.enum(JOB_LIST_FILTERS).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type JobListQuery = z.infer<typeof jobListQuerySchema>;
