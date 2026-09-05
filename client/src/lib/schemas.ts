import { z } from 'zod';

/**
 * The client validates what the API sends back, so a mismatched deployment fails
 * loudly here instead of rendering `undefined` somewhere down the page.
 */
export const healthSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  version: z.string(),
  uptimeSeconds: z.number(),
  timestamp: z.string(),
});

export type Health = z.infer<typeof healthSchema>;

export const ROLES = ['ADMIN', 'STAFF'] as const;

export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED'] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  role: z.enum(ROLES),
  status: z.enum(USER_STATUSES),
  inviteExpiresAt: z.string().nullable(),
  activatedAt: z.string().nullable(),
  suspendedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type User = z.infer<typeof userSchema>;

export const sessionResponseSchema = z.object({
  user: userSchema,
});

export const loginResponseSchema = sessionResponseSchema;

export const meResponseSchema = z.object({
  user: userSchema,
});

export const usersResponseSchema = z.object({
  users: z.array(userSchema),
});

/**
 * The invite link only comes back on the response that created it — there is no
 * endpoint that hands it out again, so the admin copies it there and then.
 */
export const invitedUserResponseSchema = z.object({
  user: userSchema,
  inviteUrl: z.string().optional(),
  emailed: z.boolean().optional(),
});

export const inviteDetailsResponseSchema = z.object({
  invite: z.object({
    name: z.string(),
    email: z.string(),
  }),
});

export const linePreviewSchema = z.object({
  measured: z.boolean(),
  quantity: z.number(),
  unit: z.string(),
  lineTotal: z.number(),
  lineTotalFormatted: z.string(),
});

export type LinePreview = z.infer<typeof linePreviewSchema>;
