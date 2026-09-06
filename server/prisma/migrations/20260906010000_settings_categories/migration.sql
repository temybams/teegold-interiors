-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_name_key" ON "product_categories"("name");

-- Seed default categories
INSERT INTO "product_categories" ("id", "name", "active", "sortOrder", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'Window Blinds', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Curtains', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Accessories', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Services', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed default company row
INSERT INTO "company_settings" ("id", "name", "tagline", "phone", "email", "address", "bankName", "accountName", "accountNumber", "updatedAt")
VALUES (
  'default',
  'Teegold Interiors',
  'Blinds, curtains and window treatments',
  '0803 000 0000',
  'hello@teegoldinteriors.ng',
  'GRA, Ado-Ekiti, Ekiti State',
  'First Bank of Nigeria',
  'Teegold Interiors',
  '0123456789',
  CURRENT_TIMESTAMP
);
