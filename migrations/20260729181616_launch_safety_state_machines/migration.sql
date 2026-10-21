-- Expand migration: new payment/refill tenant identities remain nullable so
-- old replicas can continue writing during a rolling application rollout.
-- AlterTable
ALTER TABLE "OutboxEvent" ADD COLUMN     "lockToken" TEXT,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "maxAttempts" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "nextAttemptAt" TIMESTAMP(3),
ALTER COLUMN "lastError" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PaymentSession" ADD COLUMN     "externalPaymentId" TEXT,
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "lastReconciledAt" TIMESTAMP(3),
ADD COLUMN     "reconciliationAttempts" INTEGER DEFAULT 0,
ADD COLUMN     "reconciliationStatus" TEXT DEFAULT 'pending',
ADD COLUMN     "organization" TEXT,
ADD COLUMN     "location" TEXT;

-- Denormalized immutable tenant identity keeps payment access filters direct and
-- revocation-aware while the cart/order relationships remain the source of truth.
UPDATE "PaymentSession" AS session
SET "organization" = cart."organization", "location" = cart."location"
FROM "Cart" AS cart
WHERE cart."id" = session."cart";

ALTER TABLE "Payment" ADD COLUMN "organization" TEXT, ADD COLUMN "location" TEXT;
UPDATE "Payment" AS payment
SET "organization" = orders."organization", "location" = orders."location"
FROM "Order" AS orders
WHERE orders."id" = payment."order";

-- AlterTable
ALTER TABLE "PrescriptionItem" ADD COLUMN     "quantityDispensed" INTEGER DEFAULT 0,
ADD COLUMN     "refillsReserved" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "RefillRequest" ADD COLUMN     "openRequestKey" TEXT,
ADD COLUMN     "prescriptionItem" TEXT,
ADD COLUMN     "resolutionNote" TEXT;

-- Backfill the item identity for historical requests before enforcing the new
-- item-level refill invariant. Abort rather than inventing an association when
-- a legacy request points to a prescription without an item.
UPDATE "RefillRequest" AS refill
SET "prescriptionItem" = (
  SELECT item."id"
  FROM "PrescriptionItem" AS item
  WHERE item."prescription" = refill."prescription"
  ORDER BY item."createdAt" ASC, item."id" ASC
  LIMIT 1
);

-- The relationship remains nullable during the expand release so old replicas
-- can continue writing. New code always dual-writes the item identity; a later
-- contract migration may enforce NOT NULL after old replicas are retired.

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tokenVersion" INTEGER DEFAULT 0;

-- CreateTable
CREATE TABLE "ExternalIntegrationWorkflow" (
    "id" TEXT NOT NULL,
    "workflowKey" TEXT NOT NULL DEFAULT '',
    "workflowType" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL DEFAULT '',
    "resourceId" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'pending_submission',
    "idempotencyKey" TEXT NOT NULL DEFAULT '',
    "externalReference" TEXT NOT NULL DEFAULT '',
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "attempts" INTEGER DEFAULT 0,
    "lastError" TEXT,
    "submittedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "organization" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalIntegrationWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationWebhookEvent" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL DEFAULT '',
    "externalEventId" TEXT NOT NULL DEFAULT '',
    "eventType" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'processed',
    "payload" JSONB,
    "receivedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "organization" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "workflow" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineCredential" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "tokenPrefix" TEXT NOT NULL DEFAULT '',
    "tokenHash" TEXT NOT NULL DEFAULT '',
    "scopes" JSONB,
    "status" TEXT DEFAULT 'active',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "rateWindowStartedAt" TIMESTAMP(3),
    "rateRequestCount" INTEGER DEFAULT 0,
    "organization" TEXT NOT NULL,
    "location" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MachineCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentWebhookEvent" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL DEFAULT '',
    "externalEventId" TEXT NOT NULL DEFAULT '',
    "eventType" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'received',
    "resource" JSONB,
    "error" TEXT NOT NULL DEFAULT '',
    "receivedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "organization" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalIntegrationWorkflow_workflowKey_key" ON "ExternalIntegrationWorkflow"("workflowKey");

-- CreateIndex
CREATE INDEX "ExternalIntegrationWorkflow_resourceId_idx" ON "ExternalIntegrationWorkflow"("resourceId");

-- CreateIndex
CREATE INDEX "ExternalIntegrationWorkflow_idempotencyKey_idx" ON "ExternalIntegrationWorkflow"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ExternalIntegrationWorkflow_externalReference_idx" ON "ExternalIntegrationWorkflow"("externalReference");

-- CreateIndex
CREATE INDEX "ExternalIntegrationWorkflow_organization_idx" ON "ExternalIntegrationWorkflow"("organization");

-- CreateIndex
CREATE INDEX "ExternalIntegrationWorkflow_location_idx" ON "ExternalIntegrationWorkflow"("location");

-- CreateIndex
CREATE INDEX "ExternalIntegrationWorkflow_provider_idx" ON "ExternalIntegrationWorkflow"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationWebhookEvent_eventKey_key" ON "IntegrationWebhookEvent"("eventKey");

-- CreateIndex
CREATE INDEX "IntegrationWebhookEvent_externalEventId_idx" ON "IntegrationWebhookEvent"("externalEventId");

-- CreateIndex
CREATE INDEX "IntegrationWebhookEvent_organization_idx" ON "IntegrationWebhookEvent"("organization");

-- CreateIndex
CREATE INDEX "IntegrationWebhookEvent_provider_idx" ON "IntegrationWebhookEvent"("provider");

-- CreateIndex
CREATE INDEX "IntegrationWebhookEvent_workflow_idx" ON "IntegrationWebhookEvent"("workflow");

-- CreateIndex
CREATE UNIQUE INDEX "MachineCredential_tokenPrefix_key" ON "MachineCredential"("tokenPrefix");

-- CreateIndex
CREATE UNIQUE INDEX "MachineCredential_tokenHash_key" ON "MachineCredential"("tokenHash");

-- CreateIndex
CREATE INDEX "MachineCredential_organization_idx" ON "MachineCredential"("organization");

-- CreateIndex
CREATE INDEX "MachineCredential_location_idx" ON "MachineCredential"("location");

-- CreateIndex
CREATE INDEX "MachineCredential_createdBy_idx" ON "MachineCredential"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentWebhookEvent_eventKey_key" ON "PaymentWebhookEvent"("eventKey");

-- CreateIndex
CREATE INDEX "PaymentWebhookEvent_externalEventId_idx" ON "PaymentWebhookEvent"("externalEventId");

-- CreateIndex
CREATE INDEX "PaymentWebhookEvent_organization_idx" ON "PaymentWebhookEvent"("organization");

-- CreateIndex
CREATE INDEX "PaymentWebhookEvent_provider_idx" ON "PaymentWebhookEvent"("provider");

-- CreateIndex
CREATE INDEX "OutboxEvent_lockToken_idx" ON "OutboxEvent"("lockToken");

-- CreateIndex
CREATE INDEX "PaymentSession_externalPaymentId_idx" ON "PaymentSession"("externalPaymentId");
CREATE INDEX "PaymentSession_organization_idx" ON "PaymentSession"("organization");
CREATE INDEX "PaymentSession_location_idx" ON "PaymentSession"("location");
CREATE INDEX "Payment_organization_idx" ON "Payment"("organization");
CREATE INDEX "Payment_location_idx" ON "Payment"("location");

-- CreateIndex
CREATE UNIQUE INDEX "RefillRequest_openRequestKey_key" ON "RefillRequest"("openRequestKey");

-- CreateIndex
CREATE INDEX "RefillRequest_prescriptionItem_idx" ON "RefillRequest"("prescriptionItem");

-- AddForeignKey
ALTER TABLE "ExternalIntegrationWorkflow" ADD CONSTRAINT "ExternalIntegrationWorkflow_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalIntegrationWorkflow" ADD CONSTRAINT "ExternalIntegrationWorkflow_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalIntegrationWorkflow" ADD CONSTRAINT "ExternalIntegrationWorkflow_provider_fkey" FOREIGN KEY ("provider") REFERENCES "IntegrationProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationWebhookEvent" ADD CONSTRAINT "IntegrationWebhookEvent_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationWebhookEvent" ADD CONSTRAINT "IntegrationWebhookEvent_provider_fkey" FOREIGN KEY ("provider") REFERENCES "IntegrationProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationWebhookEvent" ADD CONSTRAINT "IntegrationWebhookEvent_workflow_fkey" FOREIGN KEY ("workflow") REFERENCES "ExternalIntegrationWorkflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineCredential" ADD CONSTRAINT "MachineCredential_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineCredential" ADD CONSTRAINT "MachineCredential_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineCredential" ADD CONSTRAINT "MachineCredential_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentWebhookEvent" ADD CONSTRAINT "PaymentWebhookEvent_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentWebhookEvent" ADD CONSTRAINT "PaymentWebhookEvent_provider_fkey" FOREIGN KEY ("provider") REFERENCES "PaymentProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSession" ADD CONSTRAINT "PaymentSession_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentSession" ADD CONSTRAINT "PaymentSession_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefillRequest" ADD CONSTRAINT "RefillRequest_prescriptionItem_fkey" FOREIGN KEY ("prescriptionItem") REFERENCES "PrescriptionItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
