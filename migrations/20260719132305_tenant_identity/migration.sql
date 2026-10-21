/*
  Warnings:

  - A unique constraint covering the columns `[providerKey]` on the table `IntegrationProvider` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[membershipKey]` on the table `OrganizationMembership` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[providerKey]` on the table `PaymentProvider` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "IntegrationProvider_code_key";

-- DropIndex
DROP INDEX "PaymentProvider_code_key";

-- Backfill tenant-qualified identities before enforcing uniqueness. Existing
-- duplicate logical identities fail the migration for explicit remediation;
-- they are never deleted or silently merged.
ALTER TABLE "IntegrationProvider" ADD COLUMN "providerKey" TEXT;
UPDATE "IntegrationProvider"
SET "providerKey" = COALESCE("organization", 'unscoped:' || "id") || ':' || "code";
ALTER TABLE "IntegrationProvider" ALTER COLUMN "providerKey" SET NOT NULL, ALTER COLUMN "providerKey" SET DEFAULT '';

ALTER TABLE "OrganizationMembership" ADD COLUMN "membershipKey" TEXT;
UPDATE "OrganizationMembership"
SET "membershipKey" = COALESCE("user", 'missing-user:' || "id") || ':' || COALESCE("organization", 'missing-organization:' || "id") || ':' || COALESCE("location", '*');
ALTER TABLE "OrganizationMembership" ALTER COLUMN "membershipKey" SET NOT NULL, ALTER COLUMN "membershipKey" SET DEFAULT '';

ALTER TABLE "PaymentProvider" ADD COLUMN "providerKey" TEXT;
UPDATE "PaymentProvider"
SET "providerKey" = COALESCE("organization", 'unscoped:' || "id") || ':' || "code";
ALTER TABLE "PaymentProvider" ALTER COLUMN "providerKey" SET NOT NULL, ALTER COLUMN "providerKey" SET DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationProvider_providerKey_key" ON "IntegrationProvider"("providerKey");

-- CreateIndex
CREATE INDEX "IntegrationProvider_code_idx" ON "IntegrationProvider"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_membershipKey_key" ON "OrganizationMembership"("membershipKey");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentProvider_providerKey_key" ON "PaymentProvider"("providerKey");

-- CreateIndex
CREATE INDEX "PaymentProvider_code_idx" ON "PaymentProvider"("code");
