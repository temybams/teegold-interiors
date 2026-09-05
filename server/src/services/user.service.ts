import type { Role, User, UserStatus } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { conflict, forbidden, notFound } from '../utils/http-error';
import { createInvite } from '../utils/invite';

/** What the client is allowed to see. A password hash never leaves the server. */
export type PublicUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  inviteExpiresAt: Date | null;
  activatedAt: Date | null;
  suspendedAt: Date | null;
  createdAt: Date;
};

export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
  inviteExpiresAt: user.inviteExpiresAt,
  activatedAt: user.activatedAt,
  suspendedAt: user.suspendedAt,
  createdAt: user.createdAt,
});

/** An invite is returned once, at the moment it is created, and never again. */
export type InvitedUser = {
  user: PublicUser;
  inviteToken: string;
};

export const listUsers = async (): Promise<PublicUser[]> => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  return users.map(toPublicUser);
};

const findUserOrThrow = async (id: string): Promise<User> => {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw notFound('User not found');
  }

  return user;
};

/**
 * Suspending or demoting the only remaining admin would leave nobody able to manage
 * staff, the catalogue or settings, and no way back in without editing the database.
 */
const assertNotLastActiveAdmin = async (user: User): Promise<void> => {
  if (user.role !== 'ADMIN' || user.status !== 'ACTIVE') {
    return;
  }

  const activeAdmins = await prisma.user.count({
    where: { role: 'ADMIN', status: 'ACTIVE' },
  });

  if (activeAdmins <= 1) {
    throw forbidden('This is the only active admin. Make someone else an admin first.');
  }
};

export type InviteUserInput = {
  name: string;
  email: string;
  phone?: string;
  role: Role;
  invitedById: string;
};

export const inviteUser = async (input: InviteUserInput): Promise<InvitedUser> => {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    throw conflict('That email already has an account', [
      { field: 'email', message: 'Already in use' },
    ]);
  }

  const invite = createInvite();

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email,
      phone: input.phone || null,
      role: input.role,
      status: 'PENDING',
      inviteTokenHash: invite.tokenHash,
      inviteExpiresAt: invite.expiresAt,
      invitedById: input.invitedById,
    },
  });

  return { user: toPublicUser(user), inviteToken: invite.token };
};

/** Issues a fresh link and invalidates the previous one. */
export const resendInvite = async (id: string): Promise<InvitedUser> => {
  const user = await findUserOrThrow(id);

  if (user.passwordHash) {
    throw conflict('This person has already set a password');
  }

  const invite = createInvite();

  const updated = await prisma.user.update({
    where: { id },
    data: {
      status: 'PENDING',
      inviteTokenHash: invite.tokenHash,
      inviteExpiresAt: invite.expiresAt,
      suspendedAt: null,
    },
  });

  return { user: toPublicUser(updated), inviteToken: invite.token };
};

/** Keeps the account and its history; it only blocks signing in. */
export const suspendUser = async (id: string): Promise<PublicUser> => {
  const user = await findUserOrThrow(id);

  if (user.status === 'SUSPENDED') {
    return toPublicUser(user);
  }

  await assertNotLastActiveAdmin(user);

  const updated = await prisma.user.update({
    where: { id },
    data: {
      status: 'SUSPENDED',
      suspendedAt: new Date(),
      inviteTokenHash: null,
      inviteExpiresAt: null,
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    },
  });

  return toPublicUser(updated);
};

/**
 * Someone who already has a password goes straight back to work. Someone suspended
 * before they ever set one needs a new invite instead.
 */
export const reactivateUser = async (id: string): Promise<InvitedUser | PublicUser> => {
  const user = await findUserOrThrow(id);

  if (!user.passwordHash) {
    return resendInvite(id);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      status: 'ACTIVE',
      suspendedAt: null,
      activatedAt: user.activatedAt ?? new Date(),
    },
  });

  return toPublicUser(updated);
};
