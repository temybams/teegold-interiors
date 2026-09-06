import { Router } from 'express';

import { getDashboard, getReports } from '../controllers/dashboard.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { reportQuerySchema } from '../validations/report.validation';
import { validate } from '../validations/validate';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get('/', getDashboard);
dashboardRouter.get('/reports', validate({ query: reportQuerySchema }), getReports);
