import type { ErrorRequestHandler } from 'express';

import { isHttpError } from '../utils/http-error';

const isPrismaError = (error: unknown): boolean => {
  const name = error instanceof Error ? error.name : '';
  const code = (error as { code?: string }).code ?? '';

  return name.startsWith('Prisma') || code.startsWith('P');
};

/** The last middleware in the stack: turns anything thrown into one JSON shape. */
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  const known = isHttpError(error);
  const status = known ? error.status : 500;
  const code = known ? error.code : 'INTERNAL_ERROR';
  const issues = known ? error.issues : undefined;

  if (status >= 500) {
    console.error('[server] unhandled error', error);
  }

  // Known 4xx messages are safe to show (wrong password, pending account).
  // Database and other 500s stay in the server log — the browser only sees a calm line.
  const message =
    known && status < 500
      ? error.message
      : isPrismaError(error)
        ? 'The server hit a database problem. Try again in a moment.'
        : 'Something went wrong. Try again in a moment.';

  res.status(status).json({
    error: {
      message,
      code,
      ...(issues ? { issues } : {}),
    },
  });
};
