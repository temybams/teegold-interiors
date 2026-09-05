import type { RequestHandler } from 'express';

import { env } from '../config/env';
import { inviteEmail, sendMail } from '../lib/mail';
import {
  inviteUser,
  listUsers,
  reactivateUser,
  resendInvite,
  suspendUser,
  type InvitedUser,
  type PublicUser,
} from '../services/user.service';
import { asyncHandler } from '../utils/async-handler';
import { forbidden, unauthorized } from '../utils/http-error';
import type { InviteUserBody, SetUserStatusBody } from '../validations/user.validation';

const inviteUrlFor = (token: string): string => `${env.CLIENT_ORIGIN}/invite/${token}`;

const deliverInvite = async (
  result: InvitedUser,
  invitedByName: string,
): Promise<{ user: PublicUser; inviteUrl: string; emailed: boolean }> => {
  const inviteUrl = inviteUrlFor(result.inviteToken);
  const copy = inviteEmail({
    name: result.user.name,
    inviteUrl,
    invitedBy: invitedByName,
  });
  const emailed = await sendMail({ to: result.user.email, ...copy });

  return { user: result.user, inviteUrl, emailed };
};

const withInvite = async (
  result: InvitedUser | PublicUser,
  invitedByName: string,
): Promise<{ user: PublicUser; inviteUrl?: string; emailed?: boolean }> => {
  if (!('inviteToken' in result)) {
    return { user: result };
  }

  return deliverInvite(result, invitedByName);
};

export const getUsers: RequestHandler = asyncHandler(async (_req, res) => {
  res.json({ users: await listUsers() });
});

export const postUserInvite: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw unauthorized('Sign in to continue');
  }

  const body = req.body as InviteUserBody;
  const result = await inviteUser({ ...body, invitedById: req.user.id });

  res.status(201).json(await deliverInvite(result, req.user.name));
});

export const postUserInviteResend: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw unauthorized('Sign in to continue');
  }

  const { id } = req.params as { id: string };

  res.json(await deliverInvite(await resendInvite(id), req.user.name));
});

export const patchUserStatus: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw unauthorized('Sign in to continue');
  }

  const { id } = req.params as { id: string };
  const { status } = req.body as SetUserStatusBody;

  if (req.user.id === id) {
    throw forbidden('You cannot change your own status');
  }

  const result = status === 'SUSPENDED' ? await suspendUser(id) : await reactivateUser(id);

  res.json(await withInvite(result, req.user.name));
});
