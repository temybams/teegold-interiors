import bcrypt from 'bcryptjs';

/** 12 rounds: slow enough to be expensive to crack, fast enough for a login form. */
const SALT_ROUNDS = 12;

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, SALT_ROUNDS);

export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);
