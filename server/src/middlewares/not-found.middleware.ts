import type { RequestHandler } from 'express';

import { notFound } from '../utils/http-error';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
