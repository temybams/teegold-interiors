import type { RequestHandler } from 'express';

import { APP_NAME, APP_VERSION } from '../config/app';

export const getHealth: RequestHandler = (_req, res) => {
  res.json({
    status: 'ok',
    service: APP_NAME,
    version: APP_VERSION,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};
