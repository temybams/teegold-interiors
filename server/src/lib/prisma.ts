import { PrismaPg } from '@prisma/adapter-pg';

import { env, isProduction } from '../config/env';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Prisma 7 is driver-based: the client no longer bundles a database driver, so the
 * Postgres adapter is passed in explicitly.
 *
 * One client for the whole process. `tsx watch` reloads modules on save, so the
 * instance is cached on globalThis to avoid opening a new pool on every reload.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const createClient = (): PrismaClient =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
    log: isProduction ? ['error'] : ['warn', 'error'],
  });

export const prisma = globalForPrisma.prisma ?? createClient();

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}
