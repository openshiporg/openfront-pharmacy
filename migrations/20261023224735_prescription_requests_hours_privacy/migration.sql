-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "privacyNotice" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "PharmacyLocation" ADD COLUMN     "hours" JSONB;

-- CreateTable
CREATE TABLE "PrescriptionRequest" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL,
    "status" TEXT DEFAULT 'requested',
    "organization" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "patient" TEXT,
    "firstName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL DEFAULT '',
    "dateOfBirth" TIMESTAMP(3),
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "allergies" TEXT NOT NULL DEFAULT '',
    "insurance" TEXT NOT NULL DEFAULT '',
    "counterpartyName" TEXT NOT NULL DEFAULT '',
    "counterpartyPhone" TEXT NOT NULL DEFAULT '',
    "prescriberName" TEXT NOT NULL DEFAULT '',
    "prescriberPhone" TEXT NOT NULL DEFAULT '',
    "medications" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "resolutionNote" TEXT NOT NULL DEFAULT '',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescriptionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionRequest_idempotencyKey_key" ON "PrescriptionRequest"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PrescriptionRequest_organization_idx" ON "PrescriptionRequest"("organization");

-- CreateIndex
CREATE INDEX "PrescriptionRequest_location_idx" ON "PrescriptionRequest"("location");

-- CreateIndex
CREATE INDEX "PrescriptionRequest_user_idx" ON "PrescriptionRequest"("user");

-- CreateIndex
CREATE INDEX "PrescriptionRequest_patient_idx" ON "PrescriptionRequest"("patient");

-- CreateIndex
CREATE INDEX "PrescriptionRequest_resolvedBy_idx" ON "PrescriptionRequest"("resolvedBy");

-- AddForeignKey
ALTER TABLE "PrescriptionRequest" ADD CONSTRAINT "PrescriptionRequest_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionRequest" ADD CONSTRAINT "PrescriptionRequest_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionRequest" ADD CONSTRAINT "PrescriptionRequest_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionRequest" ADD CONSTRAINT "PrescriptionRequest_patient_fkey" FOREIGN KEY ("patient") REFERENCES "PatientProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionRequest" ADD CONSTRAINT "PrescriptionRequest_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
