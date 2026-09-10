import type { CookieOptions, Response } from 'express';

import { env, isProduction } from '../config/env';

export const ACCESS_COOKIE = 'teegold_access';
export const REFRESH_COOKIE = 'teegold_refresh';

const REFRESH_PATH = '/api/auth';

const baseCookie = (): CookieOptions => ({
  httpOnly: true,
  // Production traffic is same-site via the Vercel `/api` rewrite, so Lax is enough
  // (and works on phones). Secure is still required on HTTPS.
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
});

export const setSessionCookies = (
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
): void => {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...baseCookie(),
    maxAge: env.ACCESS_TOKEN_MS,
  });

  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseCookie(),
    path: REFRESH_PATH,
    maxAge: env.REFRESH_TOKEN_MS,
  });
};

export const clearSessionCookies = (res: Response): void => {
  res.clearCookie(ACCESS_COOKIE, baseCookie());
  res.clearCookie(REFRESH_COOKIE, { ...baseCookie(), path: REFRESH_PATH });
};
