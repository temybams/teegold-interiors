import type { RequestHandler } from 'express';

import { getDashboardSummary, getReport } from '../services/dashboard.service';
import { asyncHandler } from '../utils/async-handler';
import type { ReportQuery } from '../validations/report.validation';

export const getDashboard: RequestHandler = asyncHandler(async (_req, res) => {
  res.json(await getDashboardSummary());
});

export const getReports: RequestHandler = asyncHandler(async (req, res) => {
  const query = req.query as unknown as ReportQuery;

  res.json(await getReport(query.from, query.to));
});
