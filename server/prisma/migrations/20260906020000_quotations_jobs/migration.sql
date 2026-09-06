-- Quotations + job status on invoices

CREATE TYPE "QuotationStatus" AS ENUM ('OPEN', 'CONVERTED', 'CANCELLED');
CREATE TYPE "JobStatus" AS ENUM ('NOT_STARTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED');

CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdById" TEXT,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "subtotal" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'OPEN',
    "publicToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quotation_items" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "productId" TEXT,
    "nameSnapshot" TEXT NOT NULL,
    "pricingType" "PricingType" NOT NULL,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "area" DOUBLE PRECISION,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "lineTotal" INTEGER NOT NULL,

    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "invoices" ADD COLUMN "quotationId" TEXT;
ALTER TABLE "invoices" ADD COLUMN "jobStatus" "JobStatus" NOT NULL DEFAULT 'NOT_STARTED';
ALTER TABLE "invoices" ADD COLUMN "scheduledAt" TIMESTAMP(3);
ALTER TABLE "invoices" ADD COLUMN "completedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "quotations_number_key" ON "quotations"("number");
CREATE UNIQUE INDEX "quotations_publicToken_key" ON "quotations"("publicToken");
CREATE INDEX "quotations_customerId_idx" ON "quotations"("customerId");
CREATE INDEX "quotations_createdAt_idx" ON "quotations"("createdAt");
CREATE UNIQUE INDEX "invoices_quotationId_key" ON "invoices"("quotationId");
CREATE INDEX "invoices_jobStatus_idx" ON "invoices"("jobStatus");

ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
