import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { PrismaClient } from '../src/generated/prisma/client';

/**
 * Creates the first admin so there is someone to sign in as. Credentials come from
 * the environment, never from the repository, and re-running only updates the name
 * and role — an existing password is left alone.
 */
const seedSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SEED_ADMIN_NAME: z.string().trim().min(2, 'SEED_ADMIN_NAME is required'),
  SEED_ADMIN_EMAIL: z.string().trim().toLowerCase().email('SEED_ADMIN_EMAIL must be an email'),
  SEED_ADMIN_PASSWORD: z.string().min(8, 'SEED_ADMIN_PASSWORD needs at least 8 characters'),
});

const main = async () => {
  const parsed = seedSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `  - ${issue.message}`).join('\n');
    throw new Error(`Cannot seed, check server/.env:\n${issues}`);
  }

  const { DATABASE_URL, SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = parsed.data;

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: DATABASE_URL }),
  });

  try {
    const admin = await prisma.user.upsert({
      where: { email: SEED_ADMIN_EMAIL },
      update: { name: SEED_ADMIN_NAME, role: 'ADMIN', isActive: true },
      create: {
        name: SEED_ADMIN_NAME,
        email: SEED_ADMIN_EMAIL,
        passwordHash: await bcrypt.hash(SEED_ADMIN_PASSWORD, 12),
        role: 'ADMIN',
      },
    });

    console.log(`[seed] admin ready: ${admin.email}`);
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error: unknown) => {
  console.error('[seed] failed');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
