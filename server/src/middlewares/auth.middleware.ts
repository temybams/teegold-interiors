import type { RequestHandler } from 'express';

import type { Role } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/async-handler';
import { forbidden, unauthorized } from '../utils/http-error';
import { verifyAccessToken } from '../utils/token';

const bearerToken = (header: string | undefined): string | null =>
  header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : null;

/**
 * Reads the user from the database on every request rather than trusting the token
 * alone, so deactivating someone takes effect immediately instead of when their
 * token expires.
 */
export const requireAuth: RequestHandler = asyncHandler(async (req, _res, next) => {
  const token = bearerToken(req.headers.authorization);

  if (!token) {
    next(unauthorized('Sign in to continue'));
    return;
  }

  let userId: string;

  try {
    userId = verifyAccessToken(token).sub;
  } catch {
    next(unauthorized('Your session has expired, please sign in again'));
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.isActive) {
    next(unauthorized('Your session is no longer valid'));
    return;
  }

  req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  next();
});

/** Use after `requireAuth`. */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      next(unauthorized('Sign in to continue'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(forbidden('Only an admin can do this'));
      return;
    }

    next();
  };
