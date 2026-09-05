import 'dotenv/config';
import { z } from 'zod';

/**
 * The server refuses to boot on bad configuration rather than failing later on
 * the first request that needs it.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_MS: z.coerce.number().int().positive().default(12 * 60 * 60 * 1000),
  REFRESH_TOKEN_MS: z.coerce.number().int().positive().default(30 * 24 * 60 * 60 * 1000),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('Teegold Interiors <hello@teegoldinteriors.ng>'),
});

export type Env = z.infer<typeof envSchema>;

const parseEnv = (): Env => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');

    throw new Error(`Invalid environment variables:\n${issues}`);
  }

  return result.data;
};

export const env = parseEnv();

export const isProduction = env.NODE_ENV === 'production';

export const isMailConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
