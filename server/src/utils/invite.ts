import crypto from 'node:crypto';

/** An invite forwarded months later should not still open an account. */
export const INVITE_TTL_DAYS = 7;

export type Invite = {
  /** Sent to the person. Only ever seen once, right after it is created. */
  token: string;
  /** Stored instead of the token itself. */
  tokenHash: string;
  expiresAt: Date;
};

export const hashInviteToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export const createInvite = (): Invite => {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  return { token, tokenHash: hashInviteToken(token), expiresAt };
};

export const isInviteUsable = (expiresAt: Date | null): boolean =>
  expiresAt !== null && expiresAt.getTime() > Date.now();
