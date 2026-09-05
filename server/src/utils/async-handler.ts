import type { RequestHandler } from 'express';

/**
 * Express 4 does not catch rejected promises, so an async controller that throws
 * would hang the request. Wrapping funnels it into the error middleware instead.
 */
export const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };
