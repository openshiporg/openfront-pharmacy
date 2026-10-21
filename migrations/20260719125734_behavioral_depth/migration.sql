/*
  Warnings:

  - A unique constraint covering the columns `[eventKey]` on the table `AuditEvent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `PrescriptionTransfer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `RefillRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `TemperatureExcursion` will be added. If there are existing duplicate values, this will fail.

*/
-- Add unique lifecycle keys without assigning the same default to existing rows.
ALTER TABLE "AuditEvent" ADD COLUMN "eventKey" TEXT;
UPDATE "AuditEvent" SET "eventKey" = 'legacy:audit:' || "id" WHERE "eventKey" IS NULL;
ALTER TABLE "AuditEvent" ALTER COLUMN "eventKey" SET NOT NULL, ALTER COLUMN "eventKey" SET DEFAULT '';

ALTER TABLE "Order" ADD COLUMN "idempotencyKey" TEXT;
UPDATE "Order" SET "idempotencyKey" = 'legacy:order:' || "id" WHERE "idempotencyKey" IS NULL;
ALTER TABLE "Order" ALTER COLUMN "idempotencyKey" SET NOT NULL, ALTER COLUMN "idempotencyKey" SET DEFAULT '';

ALTER TABLE "PrescriptionTransfer" ADD COLUMN "idempotencyKey" TEXT;
UPDATE "PrescriptionTransfer" SET "idempotencyKey" = 'legacy:transfer:' || "id" WHERE "idempotencyKey" IS NULL;
ALTER TABLE "PrescriptionTransfer" ALTER COLUMN "idempotencyKey" SET NOT NULL, ALTER COLUMN "idempotencyKey" SET DEFAULT '';

ALTER TABLE "RefillRequest" ADD COLUMN "idempotencyKey" TEXT;
UPDATE "RefillRequest" SET "idempotencyKey" = 'legacy:refill:' || "id" WHERE "idempotencyKey" IS NULL;
ALTER TABLE "RefillRequest" ALTER COLUMN "idempotencyKey" SET NOT NULL, ALTER COLUMN "idempotencyKey" SET DEFAULT '';

ALTER TABLE "TemperatureExcursion" ADD COLUMN "idempotencyKey" TEXT;
UPDATE "TemperatureExcursion" SET "idempotencyKey" = 'legacy:excursion:' || "id" WHERE "idempotencyKey" IS NULL;
ALTER TABLE "TemperatureExcursion" ALTER COLUMN "idempotencyKey" SET NOT NULL, ALTER COLUMN "idempotencyKey" SET DEFAULT '';

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL DEFAULT '',
    "eventType" TEXT NOT NULL DEFAULT '',
    "aggregateType" TEXT NOT NULL DEFAULT '',
    "aggregateId" TEXT NOT NULL DEFAULT '',
    "payload" JSONB,
    "payloadHash" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "replayCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT NOT NULL DEFAULT '',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "organization" TEXT,
    "location" TEXT,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutboxEvent_eventKey_key" ON "OutboxEvent"("eventKey");

-- CreateIndex
CREATE INDEX "OutboxEvent_eventType_idx" ON "OutboxEvent"("eventType");

-- CreateIndex
CREATE INDEX "OutboxEvent_aggregateType_idx" ON "OutboxEvent"("aggregateType");

-- CreateIndex
CREATE INDEX "OutboxEvent_aggregateId_idx" ON "OutboxEvent"("aggregateId");

-- CreateIndex
CREATE INDEX "OutboxEvent_organization_idx" ON "OutboxEvent"("organization");

-- CreateIndex
CREATE INDEX "OutboxEvent_location_idx" ON "OutboxEvent"("location");

-- CreateIndex
CREATE UNIQUE INDEX "AuditEvent_eventKey_key" ON "AuditEvent"("eventKey");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionTransfer_idempotencyKey_key" ON "PrescriptionTransfer"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "RefillRequest_idempotencyKey_key" ON "RefillRequest"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "TemperatureExcursion_idempotencyKey_key" ON "TemperatureExcursion"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "OutboxEvent_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "OutboxEvent_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
