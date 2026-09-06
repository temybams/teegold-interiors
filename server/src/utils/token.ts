import jwt, { type SignOptions } from 'jsonwebtoken';
import { z } from 'zod';

import { env } from '../config/env';

const payloadSchema = z.object({
  sub: z.string(),
  role: z.enum(['ADMIN', 'STAFF']),
});

export type TokenPayload = z.infer<typeof payloadSchema>;

export const signAccessToken = (payload: TokenPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: Math.round(env.ACCESS_TOKEN_MS / 1000) as SignOptions['expiresIn'],
  });

/** Throws if the token is missing, tampered with, expired or shaped wrongly. */
export const verifyAccessToken = (token: string): TokenPayload =>
  payloadSchema.parse(jwt.verify(token, env.JWT_SECRET));
