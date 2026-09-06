import 'dotenv/config';
import { randomBytes } from 'node:crypto';
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

    const categories = [
      { name: 'Window Blinds', sortOrder: 0 },
      { name: 'Curtains', sortOrder: 1 },
      { name: 'Accessories', sortOrder: 2 },
      { name: 'Services', sortOrder: 3 },
    ];

    for (const category of categories) {
      await prisma.productCategory.upsert({
        where: { name: category.name },
        update: { sortOrder: category.sortOrder, active: true },
        create: category,
      });
    }

    console.log(`[seed] categories ready: ${categories.length}`);

    await prisma.companySettings.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        name: 'Teegold Interiors',
        tagline: 'Blinds, curtains and window treatments',
        phone: '0803 000 0000',
        email: 'hello@teegoldinteriors.ng',
        address: 'GRA, Ado-Ekiti, Ekiti State',
        bankName: 'First Bank of Nigeria',
        accountName: 'Teegold Interiors',
        accountNumber: '0123456789',
      },
    });

    console.log('[seed] company settings ready');

    const products = await prisma.product.findMany();
    const byName = new Map(products.map((product) => [product.name, product]));

    const sampleClients = [
      {
        name: 'Mrs Adeyemi',
        phone: '08031234567',
        address: '12 Adebayo Street, GRA, Ado-Ekiti',
      },
      {
        name: 'Mr Tunde Ojo',
        phone: '08039876543',
        address: 'Iworoko Road, Ado-Ekiti',
      },
      {
        name: 'Funke Homes Ltd',
        phone: '08123456789',
        address: 'New Iyin Road, Ado-Ekiti',
      },
    ];

    const clients = [];

    for (const client of sampleClients) {
      const existing = await prisma.customer.findFirst({
        where: { phone: client.phone },
      });

      clients.push(
        existing ??
          (await prisma.customer.create({
            data: client,
          })),
      );
    }

    console.log(`[seed] sample clients ready: ${clients.length}`);

    const year = new Date().getFullYear();
    const existingQuotes = await prisma.quotation.count();

    if (existingQuotes === 0) {
      const zebra = byName.get('Zebra Blind');
      const curtain = byName.get('Curtain');
      const rod = byName.get('Curtain Rod');
      const install = byName.get('Installation');
      const roller = byName.get('Roller Blind');

      if (!zebra || !curtain || !rod || !install || !roller) {
        throw new Error('Catalogue products missing; cannot seed quotations');
      }

      const nextQt = async () => {
        const key = `QT-${year}`;
        const row = await prisma.numberSequence.upsert({
          where: { key },
          create: { key, value: 1 },
          update: { value: { increment: 1 } },
        });
        return `${key}-${String(row.value).padStart(6, '0')}`;
      };

      const token = () => randomBytes(24).toString('base64url');

      // Open quote — living room blinds
      const area1 = 2.4;
      const line1 = Math.round(area1 * zebra.unitPrice);
      const line2 = rod.unitPrice * 2;
      const line3 = install.unitPrice;
      const sub1 = line1 + line2 + line3;

      await prisma.quotation.create({
        data: {
          number: await nextQt(),
          customerId: clients[0]!.id,
          createdById: admin.id,
          discount: 5_000,
          subtotal: sub1,
          total: sub1 - 5_000,
          status: 'OPEN',
          publicToken: token(),
          items: {
            create: [
              {
                productId: zebra.id,
                nameSnapshot: zebra.name,
                pricingType: zebra.pricingType,
                width: 1.2,
                height: 2.0,
                area: area1,
                quantity: area1,
                unitPrice: zebra.unitPrice,
                lineTotal: line1,
              },
              {
                productId: rod.id,
                nameSnapshot: rod.name,
                pricingType: rod.pricingType,
                quantity: 2,
                unitPrice: rod.unitPrice,
                lineTotal: line2,
              },
              {
                productId: install.id,
                nameSnapshot: install.name,
                pricingType: install.pricingType,
                quantity: 1,
                unitPrice: install.unitPrice,
                lineTotal: line3,
              },
            ],
          },
        },
      });

      // Open quote — office rollers
      const area2 = 3.0;
      const officeTotal = Math.round(area2 * roller.unitPrice) + install.unitPrice;

      await prisma.quotation.create({
        data: {
          number: await nextQt(),
          customerId: clients[1]!.id,
          createdById: admin.id,
          discount: 0,
          subtotal: officeTotal,
          total: officeTotal,
          status: 'OPEN',
          publicToken: token(),
          items: {
            create: [
              {
                productId: roller.id,
                nameSnapshot: roller.name,
                pricingType: roller.pricingType,
                width: 1.5,
                height: 2.0,
                area: area2,
                quantity: area2,
                unitPrice: roller.unitPrice,
                lineTotal: Math.round(area2 * roller.unitPrice),
              },
              {
                productId: install.id,
                nameSnapshot: install.name,
                pricingType: install.pricingType,
                quantity: 1,
                unitPrice: install.unitPrice,
                lineTotal: install.unitPrice,
              },
            ],
          },
        },
      });

      // Curtains quote
      const area3 = 4.0;
      const curtainTotal = Math.round(area3 * curtain.unitPrice) + rod.unitPrice + install.unitPrice;

      await prisma.quotation.create({
        data: {
          number: await nextQt(),
          customerId: clients[2]!.id,
          createdById: admin.id,
          discount: 10_000,
          subtotal: curtainTotal,
          total: curtainTotal - 10_000,
          status: 'OPEN',
          publicToken: token(),
          items: {
            create: [
              {
                productId: curtain.id,
                nameSnapshot: curtain.name,
                pricingType: curtain.pricingType,
                width: 2.0,
                height: 2.0,
                area: area3,
                quantity: area3,
                unitPrice: curtain.unitPrice,
                lineTotal: Math.round(area3 * curtain.unitPrice),
              },
              {
                productId: rod.id,
                nameSnapshot: rod.name,
                pricingType: rod.pricingType,
                quantity: 1,
                unitPrice: rod.unitPrice,
                lineTotal: rod.unitPrice,
              },
              {
                productId: install.id,
                nameSnapshot: install.name,
                pricingType: install.pricingType,
                quantity: 1,
                unitPrice: install.unitPrice,
                lineTotal: install.unitPrice,
              },
            ],
          },
        },
      });

      console.log('[seed] sample quotations ready: 3');
    } else {
      console.log(`[seed] quotations already present (${existingQuotes}), skipped sample quotes`);
    }
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error: unknown) => {
  console.error('[seed] failed');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
