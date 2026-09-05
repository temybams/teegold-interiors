import type { ErrorRequestHandler } from 'express';

import { isProduction } from '../config/env';
import { isHttpError } from '../utils/http-error';

/** The last middleware in the stack: turns anything thrown into one JSON shape. */
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  const status = isHttpError(error) ? error.status : 500;
  const code = isHttpError(error) ? error.code : 'INTERNAL_ERROR';
  const issues = isHttpError(error) ? error.issues : undefined;
  const message = error instanceof Error ? error.message : 'Something went wrong';

  if (status >= 500) {
    console.error('[server] unhandled error', error);
  }

  res.status(status).json({
    error: {
      // Internal failures never leak their details to the browser in production.
      message: status >= 500 && isProduction ? 'Something went wrong' : message,
      code,
      ...(issues ? { issues } : {}),
    },
  });
};
