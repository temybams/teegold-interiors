-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "users"
    ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    ADD COLUMN "inviteTokenHash" TEXT,
    ADD COLUMN "inviteExpiresAt" TIMESTAMP(3),
    ADD COLUMN "invitedById" TEXT,
    ADD COLUMN "activatedAt" TIMESTAMP(3),
    ADD COLUMN "suspendedAt" TIMESTAMP(3),
    ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Backfill before dropping isActive: anyone who could sign in must still be able to.
-- Without this the new PENDING default would lock every existing account out.
UPDATE "users" SET "status" = 'ACTIVE', "activatedAt" = "createdAt" WHERE "isActive" = true;
UPDATE "users" SET "status" = 'SUSPENDED', "suspendedAt" = CURRENT_TIMESTAMP WHERE "isActive" = false;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "isActive";

-- CreateIndex
CREATE UNIQUE INDEX "users_inviteTokenHash_key" ON "users"("inviteTokenHash");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
