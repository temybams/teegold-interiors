import { Router } from 'express';

import {
  getInvite,
  getMe,
  postAcceptInvite,
  postLogin,
  postLogout,
  postRefresh,
  postRequestReset,
  postResetPassword,
} from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { authAttemptLimiter } from '../middlewares/rate-limit.middleware';
import {
  acceptInviteSchema,
  inviteTokenParamsSchema,
  loginSchema,
  requestResetSchema,
  resetPasswordSchema,
} from '../validations/auth.validation';
import { validate } from '../validations/validate';

export const authRouter = Router();

authRouter.post('/login', authAttemptLimiter, validate({ body: loginSchema }), postLogin);
authRouter.post('/refresh', postRefresh);
authRouter.post('/logout', postLogout);

authRouter.get('/invites/:token', validate({ params: inviteTokenParamsSchema }), getInvite);
authRouter.post(
  '/invites/accept',
  authAttemptLimiter,
  validate({ body: acceptInviteSchema }),
  postAcceptInvite,
);

authRouter.post(
  '/password-reset',
  authAttemptLimiter,
  validate({ body: requestResetSchema }),
  postRequestReset,
);
authRouter.post(
  '/password-reset/confirm',
  authAttemptLimiter,
  validate({ body: resetPasswordSchema }),
  postResetPassword,
);

authRouter.get('/me', requireAuth, getMe);
