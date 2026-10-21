-- Reconcile environments that applied the earlier local draft of migration 14
-- while keeping the checked-in release history expand-compatible for old
-- replicas. These statements are idempotent across both shapes.
ALTER TABLE "PaymentSession"
  ALTER COLUMN "organization" DROP NOT NULL,
  ALTER COLUMN "location" DROP NOT NULL;

ALTER TABLE "Payment"
  ALTER COLUMN "organization" DROP NOT NULL,
  ALTER COLUMN "location" DROP NOT NULL;

ALTER TABLE "RefillRequest"
  ALTER COLUMN "prescriptionItem" DROP NOT NULL;

ALTER TABLE "OutboxEvent"
  ALTER COLUMN "lastError" DROP NOT NULL;

ALTER TABLE "ExternalIntegrationWorkflow"
  ALTER COLUMN "lastError" DROP NOT NULL;

ALTER TABLE "MachineCredential"
  ADD COLUMN IF NOT EXISTS "rateWindowStartedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rateRequestCount" INTEGER DEFAULT 0;
