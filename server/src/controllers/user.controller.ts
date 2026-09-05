import type { RequestHandler } from 'express';

import { createUser, listUsers, setUserStatus } from '../services/user.service';
import { asyncHandler } from '../utils/async-handler';
import { forbidden } from '../utils/http-error';
import type { CreateUserBody } from '../validations/user.validation';

export const getUsers: RequestHandler = asyncHandler(async (_req, res) => {
  res.json({ users: await listUsers() });
});

export const postUser: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.body as CreateUserBody;

  res.status(201).json({ user: await createUser(body) });
});

export const patchUserStatus: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const { isActive } = req.body as { isActive: boolean };

  // Without this an admin could lock themselves out of their own system.
  if (req.user?.id === id && !isActive) {
    throw forbidden('You cannot deactivate your own account');
  }

  res.json({ user: await setUserStatus(id, isActive) });
});
