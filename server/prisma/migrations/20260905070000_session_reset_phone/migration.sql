-- AlterTable
ALTER TABLE "users"
    ADD COLUMN "phone" TEXT,
    ADD COLUMN "refreshTokenHash" TEXT,
    ADD COLUMN "refreshTokenExpiresAt" TIMESTAMP(3),
    ADD COLUMN "passwordResetTokenHash" TEXT,
    ADD COLUMN "passwordResetExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_passwordResetTokenHash_key" ON "users"("passwordResetTokenHash");
