import crypto from 'node:crypto';

import { env } from '../config/env';
import { resetEmail, sendMail } from '../lib/mail';
import { prisma } from '../lib/prisma';
import { httpError, notFound, unauthorized } from '../utils/http-error';
import { hashInviteToken, isInviteUsable } from '../utils/invite';
import { hashPassword, verifyPassword } from '../utils/password';
import { signAccessToken } from '../utils/token';
import { toPublicUser, type PublicUser } from './user.service';

export type LoginInput = {
  email: string;
  password: string;
};

export type SessionResult = {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
};

const accountPending = () =>
  httpError(
    403,
    'Your account is awaiting setup. Open the invite link your administrator sent you to choose a password.',
    'ACCOUNT_PENDING',
  );

const accountSuspended = () =>
  httpError(
    403,
    'Your account has been suspended. Please contact your administrator.',
    'ACCOUNT_SUSPENDED',
  );

const issueSession = async (user: {
  id: string;
  role: PublicUser['role'];
}): Promise<Omit<SessionResult, 'user'>> => {
  const refreshToken = crypto.randomBytes(32).toString('base64url');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshTokenHash: hashInviteToken(refreshToken),
      refreshTokenExpiresAt: new Date(Date.now() + env.REFRESH_TOKEN_MS),
    },
  });

  return {
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
    refreshToken,
  };
};

export const login = async ({ email, password }: LoginInput): Promise<SessionResult> => {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (user?.status === 'PENDING') {
    throw accountPending();
  }

  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    throw unauthorized('Email or password is incorrect');
  }

  if (user.status === 'SUSPENDED') {
    throw accountSuspended();
  }

  return {
    ...(await issueSession(user)),
    user: toPublicUser(user),
  };
};

export const refreshSession = async (refreshToken: string | undefined): Promise<SessionResult> => {
  if (!refreshToken) {
    throw unauthorized('Sign in to continue');
  }

  const user = await prisma.user.findFirst({
    where: { refreshTokenHash: hashInviteToken(refreshToken) },
  });

  if (
    !user ||
    user.status !== 'ACTIVE' ||
    !user.refreshTokenExpiresAt ||
    user.refreshTokenExpiresAt.getTime() <= Date.now()
  ) {
    throw unauthorized('Your session has expired, please sign in again');
  }

  return {
    ...(await issueSession(user)),
    user: toPublicUser(user),
  };
};

export const clearRefresh = async (userId: string): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: null, refreshTokenExpiresAt: null },
  });
};

export const clearRefreshByToken = async (refreshToken: string | undefined): Promise<void> => {
  if (!refreshToken) {
    return;
  }

  await prisma.user.updateMany({
    where: { refreshTokenHash: hashInviteToken(refreshToken) },
    data: { refreshTokenHash: null, refreshTokenExpiresAt: null },
  });
};

export const getUserById = async (id: string): Promise<PublicUser> => {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user || user.status !== 'ACTIVE') {
    throw unauthorized('Your session is no longer valid');
  }

  return toPublicUser(user);
};

export type InviteDetails = {
  name: string;
  email: string;
};

const findUsableInvite = async (token: string) => {
  const user = await prisma.user.findUnique({
    where: { inviteTokenHash: hashInviteToken(token) },
  });

  if (!user || user.status !== 'PENDING' || !isInviteUsable(user.inviteExpiresAt)) {
    throw notFound('This invite link is no longer valid. Ask your administrator for a new one.');
  }

  return user;
};

/** Lets the accept page greet the person by name before they set a password. */
export const getInviteDetails = async (token: string): Promise<InviteDetails> => {
  const user = await findUsableInvite(token);

  return { name: user.name, email: user.email };
};

export type AcceptInviteInput = {
  token: string;
  password: string;
};

/** Setting the password is what activates the account, and signs them straight in. */
export const acceptInvite = async ({
  token,
  password,
}: AcceptInviteInput): Promise<SessionResult> => {
  const invited = await findUsableInvite(token);

  const user = await prisma.user.update({
    where: { id: invited.id },
    data: {
      passwordHash: await hashPassword(password),
      status: 'ACTIVE',
      activatedAt: new Date(),
      inviteTokenHash: null,
      inviteExpiresAt: null,
    },
  });

  return {
    ...(await issueSession(user)),
    user: toPublicUser(user),
  };
};

const RESET_TTL_MS = 60 * 60 * 1000;

export type ResetRequestResult = {
  emailed: boolean;
  /** Only present when SMTP is off, so local testing still works. */
  resetUrl?: string;
};

/**
 * Always looks successful to the caller so this endpoint cannot be used to
 * discover which emails have accounts.
 */
export const requestPasswordReset = async (email: string): Promise<ResetRequestResult> => {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (!user || user.status !== 'ACTIVE' || !user.passwordHash) {
    return { emailed: true };
  }

  const token = crypto.randomBytes(32).toString('base64url');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: hashInviteToken(token),
      passwordResetExpiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });

  const resetUrl = `${env.CLIENT_ORIGIN}/reset-password/${token}`;
  const copy = resetEmail({ name: user.name, resetUrl });
  const emailed = await sendMail({ to: user.email, ...copy });

  return emailed ? { emailed } : { emailed, resetUrl };
};

export const resetPassword = async (token: string, password: string): Promise<SessionResult> => {
  const user = await prisma.user.findUnique({
    where: { passwordResetTokenHash: hashInviteToken(token) },
  });

  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() <= Date.now()) {
    throw notFound('This reset link is no longer valid. Request a new one.');
  }

  if (user.status !== 'ACTIVE') {
    throw unauthorized('This account cannot sign in');
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password),
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });

  return {
    ...(await issueSession(updated)),
    user: toPublicUser(updated),
  };
};
