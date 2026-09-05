import type { RequestHandler } from 'express';

import { getUserById, login } from '../services/auth.service';
import { asyncHandler } from '../utils/async-handler';
import { unauthorized } from '../utils/http-error';
import type { LoginBody } from '../validations/auth.validation';

export const postLogin: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.body as LoginBody;
  const result = await login(body);

  res.json(result);
});

export const getMe: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw unauthorized('Sign in to continue');
  }

  res.json({ user: await getUserById(req.user.id) });
});

/**
 * The token lives in the browser, so signing out is the client discarding it.
 * This endpoint exists so the client has one place to call and we have somewhere
 * to revoke tokens later if that becomes necessary.
 */
export const postLogout: RequestHandler = (_req, res) => {
  res.status(204).send();
};
