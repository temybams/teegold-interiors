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

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(ROLES),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export type User = z.infer<typeof userSchema>;

export const loginResponseSchema = z.object({
  token: z.string(),
  user: userSchema,
});

export const meResponseSchema = z.object({
  user: userSchema,
});

export const linePreviewSchema = z.object({
  measured: z.boolean(),
  quantity: z.number(),
  unit: z.string(),
  lineTotal: z.number(),
  lineTotalFormatted: z.string(),
});

export type LinePreview = z.infer<typeof linePreviewSchema>;
