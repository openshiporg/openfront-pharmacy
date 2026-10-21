-- AlterTable
ALTER TABLE "AuditEvent" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ConsentRecord" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "HumanApproval" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "OrderLineItem" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "logoColor" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "logoIcon" TEXT NOT NULL DEFAULT '<svg xmlns="http://www.w3.org/2000/svg" fill="none" height="100%" width="100%" viewBox="0 0 42 48"><path fill="#155eef" fill-rule="evenodd" d="m22.102 20.86 9.9-9.9L29.88 8.84l-7.339 7.339V3h-3v13.178l-7.339-7.34-2.121 2.122 9.9 9.9 1.06 1.06zm2.12 2.121 9.9-9.9 2.121 2.122-7.339 7.339H42v3H28.904l7.34 7.339L34.121 35l-9.9-9.899-1.06-1.06zM7.96 35.001l9.9-9.899 1.06-1.06-1.06-1.061-9.9-9.9-2.121 2.122 7.339 7.339H.002v3h13.176l-7.34 7.339zm12.02-7.777-9.9 9.9 2.122 2.12 7.339-7.338V45h3V31.906l7.339 7.338L32 37.124l-9.9-9.9-1.06-1.061z" clip-rule="evenodd"/></svg>',
ADD COLUMN     "prescriptionFillPolicy" JSONB;

-- AlterTable
ALTER TABLE "OutboxEvent" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "intakeRequestFingerprint" TEXT;

-- AlterTable
ALTER TABLE "PrescriptionItem" ADD COLUMN     "activeFillNumber" INTEGER,
ADD COLUMN     "fillLineage" TEXT;

-- AlterTable
ALTER TABLE "PrescriptionReview" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "PrescriptionFill" (
    "id" TEXT NOT NULL,
    "reservationKey" TEXT NOT NULL DEFAULT '',
    "requestFingerprint" TEXT NOT NULL DEFAULT '',
    "openKey" TEXT,
    "kind" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'requested',
    "version" INTEGER NOT NULL DEFAULT 1,
    "fillNumber" INTEGER NOT NULL,
    "creditState" TEXT NOT NULL DEFAULT 'reserved',
    "authorizedQuantity" INTEGER NOT NULL,
    "quantityDispensed" INTEGER NOT NULL DEFAULT 0,
    "quantityReleased" INTEGER NOT NULL DEFAULT 0,
    "itemVersion" TEXT NOT NULL DEFAULT '',
    "authorityVersion" TEXT NOT NULL DEFAULT '',
    "policySnapshot" JSONB,
    "priceSnapshot" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "organization" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "patient" TEXT NOT NULL,
    "prescription" TEXT NOT NULL,
    "prescriptionItem" TEXT NOT NULL,
    "refillRequest" TEXT,
    "approval" TEXT,
    "reservedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescriptionFill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionFillEvent" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL DEFAULT '',
    "commandFingerprint" TEXT NOT NULL DEFAULT '',
    "action" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "evidence" JSONB,
    "result" JSONB,
    "fill" TEXT NOT NULL,
    "prescription" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "approval" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescriptionFillEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionFill_reservationKey_key" ON "PrescriptionFill"("reservationKey");

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionFill_openKey_key" ON "PrescriptionFill"("openKey");

-- CreateIndex
CREATE INDEX "PrescriptionFill_organization_idx" ON "PrescriptionFill"("organization");

-- CreateIndex
CREATE INDEX "PrescriptionFill_location_idx" ON "PrescriptionFill"("location");

-- CreateIndex
CREATE INDEX "PrescriptionFill_patient_idx" ON "PrescriptionFill"("patient");

-- CreateIndex
CREATE INDEX "PrescriptionFill_prescription_idx" ON "PrescriptionFill"("prescription");

-- CreateIndex
CREATE INDEX "PrescriptionFill_prescriptionItem_idx" ON "PrescriptionFill"("prescriptionItem");

-- CreateIndex
CREATE INDEX "PrescriptionFill_refillRequest_idx" ON "PrescriptionFill"("refillRequest");

-- CreateIndex
CREATE INDEX "PrescriptionFill_approval_idx" ON "PrescriptionFill"("approval");

-- CreateIndex
CREATE INDEX "PrescriptionFill_reservedBy_idx" ON "PrescriptionFill"("reservedBy");

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionFillEvent_eventKey_key" ON "PrescriptionFillEvent"("eventKey");

-- CreateIndex
CREATE INDEX "PrescriptionFillEvent_fill_idx" ON "PrescriptionFillEvent"("fill");

-- CreateIndex
CREATE INDEX "PrescriptionFillEvent_prescription_idx" ON "PrescriptionFillEvent"("prescription");

-- CreateIndex
CREATE INDEX "PrescriptionFillEvent_actor_idx" ON "PrescriptionFillEvent"("actor");

-- CreateIndex
CREATE INDEX "PrescriptionFillEvent_approval_idx" ON "PrescriptionFillEvent"("approval");

-- AddForeignKey
ALTER TABLE "PrescriptionFill" ADD CONSTRAINT "PrescriptionFill_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionFill" ADD CONSTRAINT "PrescriptionFill_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionFill" ADD CONSTRAINT "PrescriptionFill_patient_fkey" FOREIGN KEY ("patient") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionFill" ADD CONSTRAINT "PrescriptionFill_prescription_fkey" FOREIGN KEY ("prescription") REFERENCES "Prescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionFill" ADD CONSTRAINT "PrescriptionFill_prescriptionItem_fkey" FOREIGN KEY ("prescriptionItem") REFERENCES "PrescriptionItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionFill" ADD CONSTRAINT "PrescriptionFill_refillRequest_fkey" FOREIGN KEY ("refillRequest") REFERENCES "RefillRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionFill" ADD CONSTRAINT "PrescriptionFill_approval_fkey" FOREIGN KEY ("approval") REFERENCES "HumanApproval"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionFill" ADD CONSTRAINT "PrescriptionFill_reservedBy_fkey" FOREIGN KEY ("reservedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionFillEvent" ADD CONSTRAINT "PrescriptionFillEvent_fill_fkey" FOREIGN KEY ("fill") REFERENCES "PrescriptionFill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionFillEvent" ADD CONSTRAINT "PrescriptionFillEvent_prescription_fkey" FOREIGN KEY ("prescription") REFERENCES "Prescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionFillEvent" ADD CONSTRAINT "PrescriptionFillEvent_actor_fkey" FOREIGN KEY ("actor") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionFillEvent" ADD CONSTRAINT "PrescriptionFillEvent_approval_fkey" FOREIGN KEY ("approval") REFERENCES "HumanApproval"("id") ON DELETE SET NULL ON UPDATE CASCADE;
