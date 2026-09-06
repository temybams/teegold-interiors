import type { RequestHandler } from 'express';

import {
  acceptInvite,
  clearRefreshByToken,
  getInviteDetails,
  getUserById,
  login,
  refreshSession,
  requestPasswordReset,
  resetPassword,
} from '../services/auth.service';
import { asyncHandler } from '../utils/async-handler';
import { unauthorized } from '../utils/http-error';
import { ACCESS_COOKIE, REFRESH_COOKIE, clearSessionCookies, setSessionCookies } from '../utils/session';
import type {
  AcceptInviteBody,
  LoginBody,
  RequestResetBody,
  ResetPasswordBody,
} from '../validations/auth.validation';

const readAccessCookie = (req: { cookies?: Record<string, string> }): string | undefined =>
  req.cookies?.[ACCESS_COOKIE];

const readRefreshCookie = (req: { cookies?: Record<string, string> }): string | undefined =>
  req.cookies?.[REFRESH_COOKIE];

export const postLogin: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.body as LoginBody;
  const result = await login(body);

  setSessionCookies(res, result);
  res.json({ user: result.user });
});

export const postRefresh: RequestHandler = asyncHandler(async (req, res) => {
  const result = await refreshSession(readRefreshCookie(req));

  setSessionCookies(res, result);
  res.json({ user: result.user });
});

/** Public: the invited person is not signed in yet. */
export const getInvite: RequestHandler = asyncHandler(async (req, res) => {
  const { token } = req.params as { token: string };

  res.json({ invite: await getInviteDetails(token) });
});

export const postAcceptInvite: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.body as AcceptInviteBody;
  const result = await acceptInvite(body);

  setSessionCookies(res, result);
  res.json({ user: result.user });
});

export const postRequestReset: RequestHandler = asyncHandler(async (req, res) => {
  const { email } = req.body as RequestResetBody;
  const result = await requestPasswordReset(email);

  res.json({
    message: 'If that email has an account, we have sent a reset link.',
    emailed: result.emailed,
    // Only returned when SMTP is off, so you can still test locally.
    resetUrl: result.resetUrl,
  });
});

export const postResetPassword: RequestHandler = asyncHandler(async (req, res) => {
  const { token, password } = req.body as ResetPasswordBody;
  const result = await resetPassword(token, password);

  setSessionCookies(res, result);
  res.json({ user: result.user });
});

export const getMe: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw unauthorized('Sign in to continue');
  }

  res.json({ user: await getUserById(req.user.id) });
});

export const postLogout: RequestHandler = asyncHandler(async (req, res) => {
  await clearRefreshByToken(readRefreshCookie(req));
  clearSessionCookies(res);
  res.status(204).send();
});
