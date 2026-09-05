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
      update: { name: SEED_ADMIN_NAME, role: 'ADMIN', status: 'ACTIVE' },
      create: {
        name: SEED_ADMIN_NAME,
        email: SEED_ADMIN_EMAIL,
        passwordHash: await bcrypt.hash(SEED_ADMIN_PASSWORD, 12),
        role: 'ADMIN',
        // The first admin sets their own password through the environment, so there
        // is no invite to accept.
        status: 'ACTIVE',
        activatedAt: new Date(),
      },
    });

    console.log(`[seed] admin ready: ${admin.email}`);

    const catalogue = [
      { name: 'Zebra Blind', category: 'Window Blinds', pricingType: 'PER_M2' as const, unitPrice: 25_000 },
      { name: 'Roller Blind', category: 'Window Blinds', pricingType: 'PER_M2' as const, unitPrice: 20_000 },
      { name: 'Venetian Blind', category: 'Window Blinds', pricingType: 'PER_M2' as const, unitPrice: 22_000 },
      { name: 'Vertical Blind', category: 'Window Blinds', pricingType: 'PER_M2' as const, unitPrice: 18_000 },
      { name: 'Roman Blind', category: 'Window Blinds', pricingType: 'PER_M2' as const, unitPrice: 24_000 },
      { name: 'Curtain', category: 'Curtains', pricingType: 'PER_M2' as const, unitPrice: 12_000 },
      { name: 'Curtain Rod', category: 'Accessories', pricingType: 'PER_PIECE' as const, unitPrice: 8_000 },
      { name: 'Curtain Track', category: 'Accessories', pricingType: 'PER_PIECE' as const, unitPrice: 6_500 },
      { name: 'Wallpaper', category: 'Accessories', pricingType: 'PER_ROLL' as const, unitPrice: 15_000 },
      { name: 'Installation', category: 'Services', pricingType: 'PER_SERVICE' as const, unitPrice: 10_000 },
    ];

    for (const item of catalogue) {
      await prisma.product.upsert({
        where: { name: item.name },
        update: {},
        create: item,
      });
    }

    console.log(`[seed] catalogue ready: ${catalogue.length} products`);
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error: unknown) => {
  console.error('[seed] failed');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
