/*
  Warnings:

  - A unique constraint covering the columns `[storefrontKey]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[storefrontHost]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[identityKey]` on the table `PatientProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_provider_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_session_fkey";

-- DropIndex
DROP INDEX "Order_prescription_key";

-- AlterTable
ALTER TABLE "DrugReference" ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "sourceReference" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN     "order" TEXT,
ADD COLUMN     "patient" TEXT,
ADD COLUMN     "prescription" TEXT,
ADD COLUMN     "prescriptionItem" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "brandAccentColor" TEXT NOT NULL DEFAULT '#8ec9ad',
ADD COLUMN     "brandLogoUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "brandPrimaryColor" TEXT NOT NULL DEFAULT '#18352b',
ADD COLUMN     "cashPolicyReviewedAt" TIMESTAMP(3),
ADD COLUMN     "cashPolicyReviewedBy" TEXT,
ADD COLUMN     "cashSalesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cashTaxPolicyReference" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "cashTaxRateBps" INTEGER DEFAULT 0,
ADD COLUMN     "operatorDisplayName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "operatorTagline" TEXT NOT NULL DEFAULT 'Independent pharmacy care',
ADD COLUMN     "storefrontHost" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "storefrontKey" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "supportEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "supportPhone" TEXT NOT NULL DEFAULT '';

-- Backfill retained organizations before adding unique public tenant indexes.
-- Existing identity is preserved from each organization name/slug; no row is deleted.
UPDATE "Organization"
SET "operatorDisplayName" = "name",
    "storefrontKey" = lower(regexp_replace(trim("slug"), '[^a-zA-Z0-9.-]+', '-', 'g')),
    "storefrontHost" = CASE
      WHEN lower(trim("slug")) IN ('pharmacy', 'openfront-pharmacy') THEN 'pharmacy.local'
      ELSE lower(regexp_replace(trim("slug"), '[^a-zA-Z0-9.-]+', '-', 'g')) || '.pharmacy.local'
    END;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Organization" WHERE "storefrontKey" = '' OR "storefrontHost" = '' OR "operatorDisplayName" = '') THEN
    RAISE EXCEPTION 'retained organization cannot be backfilled with an empty storefront identity';
  END IF;
  IF EXISTS (SELECT "storefrontKey" FROM "Organization" GROUP BY "storefrontKey" HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'retained organization storefront keys collide after normalization';
  END IF;
  IF EXISTS (SELECT "storefrontHost" FROM "Organization" GROUP BY "storefrontHost" HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'retained organization storefront hosts collide after normalization';
  END IF;
END $$;

-- AlterTable
ALTER TABLE "OrganizationMembership" ADD COLUMN     "credentialExpiresAt" TIMESTAMP(3),
ADD COLUMN     "credentialIdentifier" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "credentialJurisdiction" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "credentialType" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "credentialVerificationMethod" TEXT DEFAULT 'not_recorded',
ADD COLUMN     "credentialVerifiedBy" TEXT;

-- AlterTable
ALTER TABLE "PatientProfile" ADD COLUMN     "address" JSONB,
ADD COLUMN     "identityEvidence" JSONB,
ADD COLUMN     "identityKey" TEXT,
ADD COLUMN     "identityReference" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "identityVerificationStatus" TEXT DEFAULT 'unverified',
ADD COLUMN     "identityVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "identityVerifiedBy" TEXT,
ADD COLUMN     "requestFingerprint" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "approval" TEXT,
ADD COLUMN     "cashReceivedAmount" INTEGER,
ADD COLUMN     "changeDueAmount" INTEGER,
ADD COLUMN     "recordedBy" TEXT,
ADD COLUMN     "tenderMethod" TEXT DEFAULT 'provider',
ALTER COLUMN "provider" DROP NOT NULL,
ALTER COLUMN "session" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Prescriber" ADD COLUMN     "credentialExpiresAt" TIMESTAMP(3),
ADD COLUMN     "credentialIdentifier" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "credentialJurisdiction" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "credentialType" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "verificationMethod" TEXT DEFAULT 'not_recorded',
ADD COLUMN     "verifiedBy" TEXT;

-- CreateTable
CREATE TABLE "ClinicalSafetyReview" (
    "id" TEXT NOT NULL,
    "reviewKey" TEXT NOT NULL DEFAULT '',
    "fillNumber" INTEGER NOT NULL,
    "outcome" TEXT NOT NULL,
    "allergiesReviewed" BOOLEAN NOT NULL DEFAULT false,
    "medicationHistoryReviewed" BOOLEAN NOT NULL DEFAULT false,
    "interactionsReviewed" BOOLEAN NOT NULL DEFAULT false,
    "duplicateTherapyReviewed" BOOLEAN NOT NULL DEFAULT false,
    "contraindicationsReviewed" BOOLEAN NOT NULL DEFAULT false,
    "doseReviewed" BOOLEAN NOT NULL DEFAULT false,
    "counselingPlanReviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewReference" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "overrideReason" TEXT NOT NULL DEFAULT '',
    "evidenceSnapshot" JSONB,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "patient" TEXT NOT NULL,
    "prescription" TEXT NOT NULL,
    "pharmacist" TEXT NOT NULL,
    "approval" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalSafetyReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispensingLabel" (
    "id" TEXT NOT NULL,
    "labelNumber" TEXT NOT NULL DEFAULT '',
    "fillNumber" INTEGER NOT NULL,
    "operatorNameSnapshot" TEXT NOT NULL DEFAULT '',
    "operatorPhoneSnapshot" TEXT NOT NULL DEFAULT '',
    "locationNameSnapshot" TEXT NOT NULL DEFAULT '',
    "locationAddressSnapshot" JSONB,
    "patientNameSnapshot" TEXT NOT NULL DEFAULT '',
    "prescriberNameSnapshot" TEXT NOT NULL DEFAULT '',
    "medicationNameSnapshot" TEXT NOT NULL DEFAULT '',
    "sigSnapshot" TEXT NOT NULL DEFAULT '',
    "quantityDispensed" INTEGER NOT NULL,
    "lotNumberSnapshot" TEXT NOT NULL DEFAULT '',
    "ndc11Snapshot" TEXT NOT NULL DEFAULT '',
    "expirationDateSnapshot" TIMESTAMP(3) NOT NULL,
    "auxiliaryWarnings" JSONB,
    "counselingOutcome" TEXT NOT NULL DEFAULT '',
    "dispensedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "patient" TEXT NOT NULL,
    "prescription" TEXT NOT NULL,
    "prescriptionItem" TEXT NOT NULL,
    "order" TEXT NOT NULL,
    "pharmacist" TEXT NOT NULL,
    "approval" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispensingLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugReferenceReview" (
    "id" TEXT NOT NULL,
    "reviewKey" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'active',
    "marketingStatusSnapshot" TEXT NOT NULL,
    "controlledScheduleSnapshot" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL DEFAULT '',
    "sourceVersion" TEXT NOT NULL DEFAULT '',
    "sourceReference" TEXT NOT NULL DEFAULT '',
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization" TEXT NOT NULL,
    "drugReference" TEXT NOT NULL,
    "reviewedBy" TEXT NOT NULL,
    "approval" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrugReferenceReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientAllergy" (
    "id" TEXT NOT NULL,
    "allergyKey" TEXT NOT NULL DEFAULT '',
    "requestFingerprint" TEXT NOT NULL DEFAULT '',
    "allergen" TEXT NOT NULL DEFAULT '',
    "reaction" TEXT NOT NULL DEFAULT '',
    "severity" TEXT DEFAULT 'unknown',
    "status" TEXT DEFAULT 'active',
    "source" TEXT NOT NULL DEFAULT '',
    "sourceReference" TEXT NOT NULL DEFAULT '',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization" TEXT NOT NULL,
    "patient" TEXT NOT NULL,
    "recordedBy" TEXT NOT NULL,
    "approval" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientAllergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientMedication" (
    "id" TEXT NOT NULL,
    "medicationKey" TEXT NOT NULL DEFAULT '',
    "requestFingerprint" TEXT NOT NULL DEFAULT '',
    "medicationName" TEXT NOT NULL DEFAULT '',
    "directions" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'current',
    "source" TEXT NOT NULL DEFAULT '',
    "sourceReference" TEXT NOT NULL DEFAULT '',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization" TEXT NOT NULL,
    "patient" TEXT NOT NULL,
    "recordedBy" TEXT NOT NULL,
    "approval" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientMedication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecallExposure" (
    "id" TEXT NOT NULL,
    "exposureKey" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'outreach_required',
    "quantityDispensed" INTEGER NOT NULL,
    "contactMethod" TEXT NOT NULL DEFAULT '',
    "outcome" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "lastActionAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "organization" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "recall" TEXT NOT NULL,
    "movement" TEXT NOT NULL,
    "patient" TEXT NOT NULL,
    "prescription" TEXT,
    "order" TEXT,
    "lastActor" TEXT,
    "approval" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecallExposure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalSafetyReview_reviewKey_key" ON "ClinicalSafetyReview"("reviewKey");

-- CreateIndex
CREATE INDEX "ClinicalSafetyReview_organization_idx" ON "ClinicalSafetyReview"("organization");

-- CreateIndex
CREATE INDEX "ClinicalSafetyReview_location_idx" ON "ClinicalSafetyReview"("location");

-- CreateIndex
CREATE INDEX "ClinicalSafetyReview_patient_idx" ON "ClinicalSafetyReview"("patient");

-- CreateIndex
CREATE INDEX "ClinicalSafetyReview_prescription_idx" ON "ClinicalSafetyReview"("prescription");

-- CreateIndex
CREATE INDEX "ClinicalSafetyReview_pharmacist_idx" ON "ClinicalSafetyReview"("pharmacist");

-- CreateIndex
CREATE INDEX "ClinicalSafetyReview_approval_idx" ON "ClinicalSafetyReview"("approval");

-- CreateIndex
CREATE UNIQUE INDEX "DispensingLabel_labelNumber_key" ON "DispensingLabel"("labelNumber");

-- CreateIndex
CREATE INDEX "DispensingLabel_organization_idx" ON "DispensingLabel"("organization");

-- CreateIndex
CREATE INDEX "DispensingLabel_location_idx" ON "DispensingLabel"("location");

-- CreateIndex
CREATE INDEX "DispensingLabel_patient_idx" ON "DispensingLabel"("patient");

-- CreateIndex
CREATE INDEX "DispensingLabel_prescription_idx" ON "DispensingLabel"("prescription");

-- CreateIndex
CREATE INDEX "DispensingLabel_prescriptionItem_idx" ON "DispensingLabel"("prescriptionItem");

-- CreateIndex
CREATE INDEX "DispensingLabel_order_idx" ON "DispensingLabel"("order");

-- CreateIndex
CREATE INDEX "DispensingLabel_pharmacist_idx" ON "DispensingLabel"("pharmacist");

-- CreateIndex
CREATE INDEX "DispensingLabel_approval_idx" ON "DispensingLabel"("approval");

-- CreateIndex
CREATE UNIQUE INDEX "DrugReferenceReview_reviewKey_key" ON "DrugReferenceReview"("reviewKey");

-- CreateIndex
CREATE INDEX "DrugReferenceReview_organization_idx" ON "DrugReferenceReview"("organization");

-- CreateIndex
CREATE INDEX "DrugReferenceReview_drugReference_idx" ON "DrugReferenceReview"("drugReference");

-- CreateIndex
CREATE INDEX "DrugReferenceReview_reviewedBy_idx" ON "DrugReferenceReview"("reviewedBy");

-- CreateIndex
CREATE INDEX "DrugReferenceReview_approval_idx" ON "DrugReferenceReview"("approval");

-- CreateIndex
CREATE UNIQUE INDEX "PatientAllergy_allergyKey_key" ON "PatientAllergy"("allergyKey");

-- CreateIndex
CREATE INDEX "PatientAllergy_organization_idx" ON "PatientAllergy"("organization");

-- CreateIndex
CREATE INDEX "PatientAllergy_patient_idx" ON "PatientAllergy"("patient");

-- CreateIndex
CREATE INDEX "PatientAllergy_recordedBy_idx" ON "PatientAllergy"("recordedBy");

-- CreateIndex
CREATE INDEX "PatientAllergy_approval_idx" ON "PatientAllergy"("approval");

-- CreateIndex
CREATE UNIQUE INDEX "PatientMedication_medicationKey_key" ON "PatientMedication"("medicationKey");

-- CreateIndex
CREATE INDEX "PatientMedication_organization_idx" ON "PatientMedication"("organization");

-- CreateIndex
CREATE INDEX "PatientMedication_patient_idx" ON "PatientMedication"("patient");

-- CreateIndex
CREATE INDEX "PatientMedication_recordedBy_idx" ON "PatientMedication"("recordedBy");

-- CreateIndex
CREATE INDEX "PatientMedication_approval_idx" ON "PatientMedication"("approval");

-- CreateIndex
CREATE UNIQUE INDEX "RecallExposure_exposureKey_key" ON "RecallExposure"("exposureKey");

-- CreateIndex
CREATE INDEX "RecallExposure_organization_idx" ON "RecallExposure"("organization");

-- CreateIndex
CREATE INDEX "RecallExposure_location_idx" ON "RecallExposure"("location");

-- CreateIndex
CREATE INDEX "RecallExposure_recall_idx" ON "RecallExposure"("recall");

-- CreateIndex
CREATE INDEX "RecallExposure_movement_idx" ON "RecallExposure"("movement");

-- CreateIndex
CREATE INDEX "RecallExposure_patient_idx" ON "RecallExposure"("patient");

-- CreateIndex
CREATE INDEX "RecallExposure_prescription_idx" ON "RecallExposure"("prescription");

-- CreateIndex
CREATE INDEX "RecallExposure_order_idx" ON "RecallExposure"("order");

-- CreateIndex
CREATE INDEX "RecallExposure_lastActor_idx" ON "RecallExposure"("lastActor");

-- CreateIndex
CREATE INDEX "RecallExposure_approval_idx" ON "RecallExposure"("approval");

-- CreateIndex
CREATE INDEX "DrugReference_reviewedBy_idx" ON "DrugReference"("reviewedBy");

-- CreateIndex
CREATE INDEX "InventoryMovement_patient_idx" ON "InventoryMovement"("patient");

-- CreateIndex
CREATE INDEX "InventoryMovement_prescription_idx" ON "InventoryMovement"("prescription");

-- CreateIndex
CREATE INDEX "InventoryMovement_prescriptionItem_idx" ON "InventoryMovement"("prescriptionItem");

-- CreateIndex
CREATE INDEX "InventoryMovement_order_idx" ON "InventoryMovement"("order");

-- CreateIndex
CREATE INDEX "Order_prescription_idx" ON "Order"("prescription");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_storefrontKey_key" ON "Organization"("storefrontKey");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_storefrontHost_key" ON "Organization"("storefrontHost");

-- CreateIndex
CREATE INDEX "Organization_cashPolicyReviewedBy_idx" ON "Organization"("cashPolicyReviewedBy");

-- CreateIndex
CREATE INDEX "OrganizationMembership_credentialVerifiedBy_idx" ON "OrganizationMembership"("credentialVerifiedBy");

-- CreateIndex
CREATE UNIQUE INDEX "PatientProfile_identityKey_key" ON "PatientProfile"("identityKey");

-- CreateIndex
CREATE INDEX "PatientProfile_identityVerifiedBy_idx" ON "PatientProfile"("identityVerifiedBy");

-- CreateIndex
CREATE INDEX "Payment_recordedBy_idx" ON "Payment"("recordedBy");

-- CreateIndex
CREATE INDEX "Payment_approval_idx" ON "Payment"("approval");

-- CreateIndex
CREATE INDEX "Prescriber_verifiedBy_idx" ON "Prescriber"("verifiedBy");

-- AddForeignKey
ALTER TABLE "ClinicalSafetyReview" ADD CONSTRAINT "ClinicalSafetyReview_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalSafetyReview" ADD CONSTRAINT "ClinicalSafetyReview_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalSafetyReview" ADD CONSTRAINT "ClinicalSafetyReview_patient_fkey" FOREIGN KEY ("patient") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalSafetyReview" ADD CONSTRAINT "ClinicalSafetyReview_prescription_fkey" FOREIGN KEY ("prescription") REFERENCES "Prescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalSafetyReview" ADD CONSTRAINT "ClinicalSafetyReview_pharmacist_fkey" FOREIGN KEY ("pharmacist") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalSafetyReview" ADD CONSTRAINT "ClinicalSafetyReview_approval_fkey" FOREIGN KEY ("approval") REFERENCES "HumanApproval"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingLabel" ADD CONSTRAINT "DispensingLabel_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingLabel" ADD CONSTRAINT "DispensingLabel_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingLabel" ADD CONSTRAINT "DispensingLabel_patient_fkey" FOREIGN KEY ("patient") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingLabel" ADD CONSTRAINT "DispensingLabel_prescription_fkey" FOREIGN KEY ("prescription") REFERENCES "Prescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingLabel" ADD CONSTRAINT "DispensingLabel_prescriptionItem_fkey" FOREIGN KEY ("prescriptionItem") REFERENCES "PrescriptionItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingLabel" ADD CONSTRAINT "DispensingLabel_order_fkey" FOREIGN KEY ("order") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingLabel" ADD CONSTRAINT "DispensingLabel_pharmacist_fkey" FOREIGN KEY ("pharmacist") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingLabel" ADD CONSTRAINT "DispensingLabel_approval_fkey" FOREIGN KEY ("approval") REFERENCES "HumanApproval"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugReference" ADD CONSTRAINT "DrugReference_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugReferenceReview" ADD CONSTRAINT "DrugReferenceReview_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugReferenceReview" ADD CONSTRAINT "DrugReferenceReview_drugReference_fkey" FOREIGN KEY ("drugReference") REFERENCES "DrugReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugReferenceReview" ADD CONSTRAINT "DrugReferenceReview_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugReferenceReview" ADD CONSTRAINT "DrugReferenceReview_approval_fkey" FOREIGN KEY ("approval") REFERENCES "HumanApproval"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_patient_fkey" FOREIGN KEY ("patient") REFERENCES "PatientProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_prescription_fkey" FOREIGN KEY ("prescription") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_prescriptionItem_fkey" FOREIGN KEY ("prescriptionItem") REFERENCES "PrescriptionItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_order_fkey" FOREIGN KEY ("order") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_cashPolicyReviewedBy_fkey" FOREIGN KEY ("cashPolicyReviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_credentialVerifiedBy_fkey" FOREIGN KEY ("credentialVerifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAllergy" ADD CONSTRAINT "PatientAllergy_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAllergy" ADD CONSTRAINT "PatientAllergy_patient_fkey" FOREIGN KEY ("patient") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAllergy" ADD CONSTRAINT "PatientAllergy_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAllergy" ADD CONSTRAINT "PatientAllergy_approval_fkey" FOREIGN KEY ("approval") REFERENCES "HumanApproval"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientMedication" ADD CONSTRAINT "PatientMedication_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientMedication" ADD CONSTRAINT "PatientMedication_patient_fkey" FOREIGN KEY ("patient") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientMedication" ADD CONSTRAINT "PatientMedication_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientMedication" ADD CONSTRAINT "PatientMedication_approval_fkey" FOREIGN KEY ("approval") REFERENCES "HumanApproval"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientProfile" ADD CONSTRAINT "PatientProfile_identityVerifiedBy_fkey" FOREIGN KEY ("identityVerifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_provider_fkey" FOREIGN KEY ("provider") REFERENCES "PaymentProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_session_fkey" FOREIGN KEY ("session") REFERENCES "PaymentSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_approval_fkey" FOREIGN KEY ("approval") REFERENCES "HumanApproval"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescriber" ADD CONSTRAINT "Prescriber_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecallExposure" ADD CONSTRAINT "RecallExposure_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecallExposure" ADD CONSTRAINT "RecallExposure_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecallExposure" ADD CONSTRAINT "RecallExposure_recall_fkey" FOREIGN KEY ("recall") REFERENCES "Recall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecallExposure" ADD CONSTRAINT "RecallExposure_movement_fkey" FOREIGN KEY ("movement") REFERENCES "InventoryMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecallExposure" ADD CONSTRAINT "RecallExposure_patient_fkey" FOREIGN KEY ("patient") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecallExposure" ADD CONSTRAINT "RecallExposure_prescription_fkey" FOREIGN KEY ("prescription") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecallExposure" ADD CONSTRAINT "RecallExposure_order_fkey" FOREIGN KEY ("order") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecallExposure" ADD CONSTRAINT "RecallExposure_lastActor_fkey" FOREIGN KEY ("lastActor") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecallExposure" ADD CONSTRAINT "RecallExposure_approval_fkey" FOREIGN KEY ("approval") REFERENCES "HumanApproval"("id") ON DELETE SET NULL ON UPDATE CASCADE;
