import { Router } from 'express';

import {
  getUsers,
  patchUserStatus,
  postUserInvite,
  postUserInviteResend,
} from '../controllers/user.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import {
  inviteUserSchema,
  setUserStatusSchema,
  userIdParamsSchema,
} from '../validations/user.validation';
import { validate } from '../validations/validate';

export const userRouter = Router();

// Managing accounts is admin-only; staff never reach these handlers.
userRouter.use(requireAuth, requireRole('ADMIN'));

userRouter.get('/', getUsers);
userRouter.post('/invites', validate({ body: inviteUserSchema }), postUserInvite);
userRouter.post(
  '/:id/invites',
  validate({ params: userIdParamsSchema }),
  postUserInviteResend,
);
userRouter.patch(
  '/:id/status',
  validate({ params: userIdParamsSchema, body: setUserStatusSchema }),
  patchUserStatus,
);
