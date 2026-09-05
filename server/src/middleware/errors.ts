import type { ErrorRequestHandler, RequestHandler } from 'express';

import { isProduction } from '../env';

export type ApiError = Error & {
  status?: number;
  code?: string;
};

/** Every failure leaves the API in the same shape, so the web app parses one thing. */
export const httpError = (status: number, message: string, code?: string): ApiError => {
  const error: ApiError = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(httpError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
};

export const errorHandler: ErrorRequestHandler = (error: ApiError, _req, res, _next) => {
  const status = error.status ?? 500;

  if (status >= 500) {
    console.error('[api] unhandled error', error);
  }

  res.status(status).json({
    error: {
      message: status >= 500 && isProduction ? 'Something went wrong' : error.message,
      code: error.code ?? 'INTERNAL_ERROR',
    },
  });
};
