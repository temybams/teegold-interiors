import { prisma } from '../lib/prisma';
import { forbidden, unauthorized } from '../utils/http-error';
import { verifyPassword } from '../utils/password';
import { signAccessToken } from '../utils/token';
import { toPublicUser, type PublicUser } from './user.service';

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResult = {
  token: string;
  user: PublicUser;
};

export const login = async ({ email, password }: LoginInput): Promise<LoginResult> => {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // The same message for an unknown email and a wrong password, so this endpoint
  // cannot be used to discover which emails have accounts.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw unauthorized('Email or password is incorrect');
  }

  if (!user.isActive) {
    throw forbidden('This account has been deactivated. Ask an admin to restore it.');
  }

  return {
    token: signAccessToken({ sub: user.id, role: user.role }),
    user: toPublicUser(user),
  };
};

export const getUserById = async (id: string): Promise<PublicUser> => {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user || !user.isActive) {
    throw unauthorized('Your session is no longer valid');
  }

  return toPublicUser(user);
};
