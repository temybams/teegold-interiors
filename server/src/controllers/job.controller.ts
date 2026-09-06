import type { RequestHandler } from 'express';

import { listJobs, updateJobStatus } from '../services/invoice.service';
import { asyncHandler } from '../utils/async-handler';
import type { JobListQuery, JobStatusBody } from '../validations/job.validation';

export const getJobs: RequestHandler = asyncHandler(async (req, res) => {
  const query = req.query as unknown as JobListQuery;

  res.json(await listJobs(query));
});

export const patchInvoiceJob: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const body = req.body as JobStatusBody;

  res.json({ invoice: await updateJobStatus(id, body) });
});
