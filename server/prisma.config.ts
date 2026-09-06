import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/** Prisma 7 reads schema location, migrations and the seed command from here. */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
