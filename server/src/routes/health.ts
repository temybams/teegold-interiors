import { Router } from 'express';
import type { HealthResponse } from '@teegold/shared';

import { version } from '../version';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  const body: HealthResponse = {
    status: 'ok',
    service: 'teegold-api',
    version,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };

  res.json(body);
});
