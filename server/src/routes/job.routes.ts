import { Router } from 'express';

import { getJobs, patchInvoiceJob } from '../controllers/job.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { invoiceIdParamsSchema } from '../validations/invoice.validation';
import { jobListQuerySchema, jobStatusBodySchema } from '../validations/job.validation';
import { validate } from '../validations/validate';

export const jobRouter = Router();

jobRouter.use(requireAuth);

jobRouter.get('/', validate({ query: jobListQuerySchema }), getJobs);
jobRouter.patch(
  '/:id',
  validate({ params: invoiceIdParamsSchema, body: jobStatusBodySchema }),
  patchInvoiceJob,
);
