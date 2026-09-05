import type { Role, User } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { conflict, notFound } from '../utils/http-error';
import { hashPassword } from '../utils/password';

/** What the client is allowed to see. A password hash never leaves the server. */
export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
};

export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

export const listUsers = async (): Promise<PublicUser[]> => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  return users.map(toPublicUser);
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

export const createUser = async (input: CreateUserInput): Promise<PublicUser> => {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    throw conflict('That email already has an account', [
      { field: 'email', message: 'Already in use' },
    ]);
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email,
      passwordHash: await hashPassword(input.password),
      role: input.role,
    },
  });

  return toPublicUser(user);
};

/** Deactivating keeps the account and its history; it only blocks signing in. */
export const setUserStatus = async (id: string, isActive: boolean): Promise<PublicUser> => {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw notFound('User not found');
  }

  const updated = await prisma.user.update({ where: { id }, data: { isActive } });
  return toPublicUser(updated);
};
