/*
  Warnings:

  - You are about to drop the column `canCreateTodos` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `canEditOtherPeople` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `canManageAllTodos` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `canManagePeople` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `canSeeOtherPeople` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the `Todo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TodoImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_Todo_todoImages` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `Role` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Todo" DROP CONSTRAINT "Todo_assignedTo_fkey";

-- DropForeignKey
ALTER TABLE "_Todo_todoImages" DROP CONSTRAINT "_Todo_todoImages_A_fkey";

-- DropForeignKey
ALTER TABLE "_Todo_todoImages" DROP CONSTRAINT "_Todo_todoImages_B_fkey";

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "canCreateTodos",
DROP COLUMN "canEditOtherPeople",
DROP COLUMN "canManageAllTodos",
DROP COLUMN "canManagePeople",
DROP COLUMN "canSeeOtherPeople",
ADD COLUMN     "canApproveConsequentialActions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canDispenseMedications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageCatalog" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageIntegrations" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageInventory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageLocations" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageOnboarding" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageOrders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageOrganizations" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManagePatients" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManagePayments" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManagePrescriptions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageRecalls" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageUsers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canReviewPrescriptions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewAuditLogs" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewPatientPrivateData" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "onboardingStatus" TEXT DEFAULT 'not_started',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "Todo";

-- DropTable
DROP TABLE "TodoImage";

-- DropTable
DROP TABLE "_Todo_todoImages";

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL DEFAULT '',
    "resourceType" TEXT NOT NULL DEFAULT '',
    "resourceId" TEXT NOT NULL DEFAULT '',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorType" TEXT NOT NULL DEFAULT 'user',
    "metadata" JSONB,
    "organization" TEXT,
    "location" TEXT,
    "actor" TEXT,
    "patient" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "guestTokenHash" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'active',
    "fulfillmentMethod" TEXT DEFAULT 'pickup',
    "subtotalAmount" INTEGER DEFAULT 0,
    "taxAmount" INTEGER DEFAULT 0,
    "deliveryAmount" INTEGER DEFAULT 0,
    "totalAmount" INTEGER DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "organization" TEXT,
    "location" TEXT,
    "customer" TEXT,
    "order" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceAmount" INTEGER NOT NULL,
    "cart" TEXT,
    "product" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL DEFAULT '',
    "statementKey" TEXT NOT NULL DEFAULT '',
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "captureMethod" TEXT NOT NULL DEFAULT '',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "evidence" JSONB,
    "patient" TEXT,
    "actor" TEXT,
    "transfer" TEXT,
    "order" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugReference" (
    "id" TEXT NOT NULL,
    "ndc11" TEXT NOT NULL DEFAULT '',
    "proprietaryName" TEXT NOT NULL DEFAULT '',
    "genericName" TEXT NOT NULL DEFAULT '',
    "labelerName" TEXT NOT NULL DEFAULT '',
    "dosageForm" TEXT NOT NULL DEFAULT '',
    "route" TEXT NOT NULL DEFAULT '',
    "strength" TEXT NOT NULL DEFAULT '',
    "rxNormCui" TEXT NOT NULL DEFAULT '',
    "controlledSchedule" TEXT DEFAULT 'unverified',
    "marketingStatus" TEXT DEFAULT 'unverified',
    "sourceName" TEXT NOT NULL DEFAULT 'manual_demo',
    "sourceVersion" TEXT NOT NULL DEFAULT '',
    "sourceVerified" BOOLEAN NOT NULL DEFAULT false,
    "referenceData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrugReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fulfillment" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT DEFAULT 'pending',
    "handoffCodeHash" TEXT NOT NULL DEFAULT '',
    "readyAt" TIMESTAMP(3),
    "handedOffAt" TIMESTAMP(3),
    "organization" TEXT,
    "location" TEXT,
    "order" TEXT,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fulfillment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HumanApproval" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "attested" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidence" JSONB,
    "organization" TEXT,
    "location" TEXT,
    "actor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HumanApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "code" TEXT NOT NULL DEFAULT '',
    "providerType" TEXT NOT NULL,
    "status" TEXT DEFAULT 'unconfigured',
    "credentials" JSONB,
    "configuration" JSONB,
    "submitFunction" TEXT NOT NULL DEFAULT '',
    "statusFunction" TEXT NOT NULL DEFAULT '',
    "webhookFunction" TEXT NOT NULL DEFAULT '',
    "externalValidationComplete" BOOLEAN NOT NULL DEFAULT false,
    "validationReference" TEXT NOT NULL DEFAULT '',
    "validatedAt" TIMESTAMP(3),
    "organization" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLot" (
    "id" TEXT NOT NULL,
    "lotNumber" TEXT NOT NULL DEFAULT '',
    "serialNumber" TEXT NOT NULL DEFAULT '',
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantityReceived" INTEGER NOT NULL,
    "quantityAvailable" INTEGER NOT NULL,
    "quantityQuarantined" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT DEFAULT 'quarantined',
    "storageBin" TEXT NOT NULL DEFAULT '',
    "coldChainRequired" BOOLEAN NOT NULL DEFAULT false,
    "minimumTemperatureC" DOUBLE PRECISION,
    "maximumTemperatureC" DOUBLE PRECISION,
    "coldChainEvidenceComplete" BOOLEAN NOT NULL DEFAULT false,
    "product" TEXT,
    "location" TEXT,
    "supplier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "movementType" TEXT NOT NULL,
    "quantityDelta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "idempotencyKey" TEXT NOT NULL DEFAULT '',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization" TEXT,
    "location" TEXT,
    "product" TEXT,
    "lot" TEXT,
    "actor" TEXT,
    "approval" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL DEFAULT '',
    "guestTokenHash" TEXT NOT NULL DEFAULT '',
    "checkoutEvidence" JSONB,
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'pending',
    "fulfillmentMethod" TEXT DEFAULT 'pickup',
    "subtotalAmount" INTEGER NOT NULL,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,
    "deliveryAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "pickupAt" TIMESTAMP(3),
    "deliveryWindow" TEXT NOT NULL DEFAULT '',
    "shippingAddressSnapshot" JSONB,
    "billingAddressSnapshot" JSONB,
    "organization" TEXT,
    "location" TEXT,
    "customer" TEXT,
    "patient" TEXT,
    "prescription" TEXT,
    "approval" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLineItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "sku" TEXT NOT NULL DEFAULT '',
    "ndc11Snapshot" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL,
    "unitPriceAmount" INTEGER NOT NULL,
    "lineTotalAmount" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "prescriptionRequirementSnapshot" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB,
    "order" TEXT,
    "product" TEXT,
    "lotAllocationSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "slug" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL,
    "user" TEXT,
    "organization" TEXT,
    "location" TEXT,
    "membershipRole" TEXT DEFAULT 'read_only',
    "status" TEXT DEFAULT 'invited',
    "externalCredentialValidated" BOOLEAN NOT NULL DEFAULT false,
    "credentialValidationReference" TEXT NOT NULL DEFAULT '',
    "credentialValidatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientProfile" (
    "id" TEXT NOT NULL,
    "patientNumber" TEXT NOT NULL DEFAULT '',
    "firstName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'active',
    "dateOfBirth" TIMESTAMP(3),
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "preferredContactMethod" TEXT DEFAULT 'none',
    "notes" TEXT NOT NULL DEFAULT '',
    "user" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT DEFAULT 'pending',
    "externalPaymentId" TEXT NOT NULL DEFAULT '',
    "processedAt" TIMESTAMP(3),
    "data" JSONB,
    "order" TEXT,
    "provider" TEXT,
    "session" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "code" TEXT NOT NULL DEFAULT '',
    "isInstalled" BOOLEAN NOT NULL DEFAULT false,
    "credentials" JSONB,
    "metadata" JSONB,
    "createPaymentFunction" TEXT NOT NULL DEFAULT '',
    "capturePaymentFunction" TEXT NOT NULL DEFAULT '',
    "refundPaymentFunction" TEXT NOT NULL DEFAULT '',
    "getPaymentStatusFunction" TEXT NOT NULL DEFAULT '',
    "generatePaymentLinkFunction" TEXT NOT NULL DEFAULT '',
    "handleWebhookFunction" TEXT NOT NULL DEFAULT '',
    "organization" TEXT,
    "integrationProvider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSession" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT DEFAULT 'pending',
    "isSelected" BOOLEAN NOT NULL DEFAULT true,
    "idempotencyKey" TEXT NOT NULL DEFAULT '',
    "data" JSONB,
    "cart" TEXT,
    "provider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "code" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'active',
    "organization" TEXT,
    "address" JSONB,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "phone" TEXT NOT NULL DEFAULT '',
    "onlineOrderingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pickupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "deliveryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PharmacyLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescriber" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "npi" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "fax" TEXT NOT NULL DEFAULT '',
    "externalIdentifier" TEXT NOT NULL DEFAULT '',
    "verificationStatus" TEXT DEFAULT 'unverified',
    "externalValidationComplete" BOOLEAN NOT NULL DEFAULT false,
    "validationReference" TEXT NOT NULL DEFAULT '',
    "validatedAt" TIMESTAMP(3),
    "organization" TEXT,
    "integrationProvider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prescriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "prescriptionNumber" TEXT NOT NULL DEFAULT '',
    "source" TEXT DEFAULT 'manual_demo',
    "sourceVerificationStatus" TEXT DEFAULT 'unverified',
    "externalReference" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'draft',
    "writtenAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "dispensedAt" TIMESTAMP(3),
    "organization" TEXT,
    "location" TEXT,
    "patient" TEXT,
    "prescriber" TEXT,
    "approval" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionItem" (
    "id" TEXT NOT NULL,
    "medicationNameSnapshot" TEXT NOT NULL DEFAULT '',
    "sig" TEXT NOT NULL DEFAULT '',
    "quantityPrescribed" INTEGER NOT NULL,
    "daysSupply" INTEGER,
    "refillsAuthorized" INTEGER DEFAULT 0,
    "refillsRemaining" INTEGER DEFAULT 0,
    "substitutionAllowed" BOOLEAN NOT NULL DEFAULT false,
    "prescription" TEXT,
    "drugReference" TEXT,
    "product" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionReview" (
    "id" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "humanAttested" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prescription" TEXT,
    "patient" TEXT,
    "pharmacist" TEXT,
    "approval" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescriptionReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionTransfer" (
    "id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT DEFAULT 'requested',
    "counterpartyName" TEXT NOT NULL DEFAULT '',
    "counterpartyPhone" TEXT NOT NULL DEFAULT '',
    "requestedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "patient" TEXT,
    "prescription" TEXT,
    "approval" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescriptionTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "handle" TEXT NOT NULL DEFAULT '',
    "sku" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'draft',
    "category" TEXT DEFAULT 'otc_medication',
    "prescriptionRequirement" TEXT DEFAULT 'none',
    "priceAmount" INTEGER NOT NULL DEFAULT 0,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "onlineAvailable" BOOLEAN NOT NULL DEFAULT false,
    "posAvailable" BOOLEAN NOT NULL DEFAULT true,
    "coldChainRequired" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "organization" TEXT,
    "location" TEXT,
    "drugReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recall" (
    "id" TEXT NOT NULL,
    "recallNumber" TEXT NOT NULL DEFAULT '',
    "classification" TEXT DEFAULT 'unverified',
    "status" TEXT DEFAULT 'draft',
    "reason" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT '',
    "sourceValidationReference" TEXT NOT NULL DEFAULT '',
    "initiatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "organization" TEXT,
    "location" TEXT,
    "approval" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefillRequest" (
    "id" TEXT NOT NULL,
    "status" TEXT DEFAULT 'requested',
    "requestNote" TEXT NOT NULL DEFAULT '',
    "requestedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "patient" TEXT,
    "prescription" TEXT,
    "location" TEXT,
    "approval" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefillRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "accountReference" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'pending_validation',
    "organization" TEXT,
    "integrationProvider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemperatureExcursion" (
    "id" TEXT NOT NULL,
    "observedMinimumC" DOUBLE PRECISION NOT NULL,
    "observedMaximumC" DOUBLE PRECISION NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "status" TEXT DEFAULT 'open',
    "dispositionReason" TEXT NOT NULL DEFAULT '',
    "organization" TEXT,
    "location" TEXT,
    "lot" TEXT,
    "reviewedBy" TEXT,
    "approval" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemperatureExcursion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_InventoryLot_recalls" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Organization_patients" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "AuditEvent_organization_idx" ON "AuditEvent"("organization");

-- CreateIndex
CREATE INDEX "AuditEvent_location_idx" ON "AuditEvent"("location");

-- CreateIndex
CREATE INDEX "AuditEvent_actor_idx" ON "AuditEvent"("actor");

-- CreateIndex
CREATE INDEX "AuditEvent_patient_idx" ON "AuditEvent"("patient");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_order_key" ON "Cart"("order");

-- CreateIndex
CREATE INDEX "Cart_guestTokenHash_idx" ON "Cart"("guestTokenHash");

-- CreateIndex
CREATE INDEX "Cart_organization_idx" ON "Cart"("organization");

-- CreateIndex
CREATE INDEX "Cart_location_idx" ON "Cart"("location");

-- CreateIndex
CREATE INDEX "Cart_customer_idx" ON "Cart"("customer");

-- CreateIndex
CREATE INDEX "CartItem_cart_idx" ON "CartItem"("cart");

-- CreateIndex
CREATE INDEX "CartItem_product_idx" ON "CartItem"("product");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentRecord_transfer_key" ON "ConsentRecord"("transfer");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentRecord_order_key" ON "ConsentRecord"("order");

-- CreateIndex
CREATE INDEX "ConsentRecord_patient_idx" ON "ConsentRecord"("patient");

-- CreateIndex
CREATE INDEX "ConsentRecord_actor_idx" ON "ConsentRecord"("actor");

-- CreateIndex
CREATE UNIQUE INDEX "DrugReference_ndc11_key" ON "DrugReference"("ndc11");

-- CreateIndex
CREATE UNIQUE INDEX "Fulfillment_order_key" ON "Fulfillment"("order");

-- CreateIndex
CREATE INDEX "Fulfillment_organization_idx" ON "Fulfillment"("organization");

-- CreateIndex
CREATE INDEX "Fulfillment_location_idx" ON "Fulfillment"("location");

-- CreateIndex
CREATE INDEX "Fulfillment_assignedTo_idx" ON "Fulfillment"("assignedTo");

-- CreateIndex
CREATE INDEX "HumanApproval_organization_idx" ON "HumanApproval"("organization");

-- CreateIndex
CREATE INDEX "HumanApproval_location_idx" ON "HumanApproval"("location");

-- CreateIndex
CREATE INDEX "HumanApproval_actor_idx" ON "HumanApproval"("actor");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationProvider_code_key" ON "IntegrationProvider"("code");

-- CreateIndex
CREATE INDEX "IntegrationProvider_organization_idx" ON "IntegrationProvider"("organization");

-- CreateIndex
CREATE INDEX "InventoryLot_lotNumber_idx" ON "InventoryLot"("lotNumber");

-- CreateIndex
CREATE INDEX "InventoryLot_product_idx" ON "InventoryLot"("product");

-- CreateIndex
CREATE INDEX "InventoryLot_location_idx" ON "InventoryLot"("location");

-- CreateIndex
CREATE INDEX "InventoryLot_supplier_idx" ON "InventoryLot"("supplier");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryMovement_idempotencyKey_key" ON "InventoryMovement"("idempotencyKey");

-- CreateIndex
CREATE INDEX "InventoryMovement_organization_idx" ON "InventoryMovement"("organization");

-- CreateIndex
CREATE INDEX "InventoryMovement_location_idx" ON "InventoryMovement"("location");

-- CreateIndex
CREATE INDEX "InventoryMovement_product_idx" ON "InventoryMovement"("product");

-- CreateIndex
CREATE INDEX "InventoryMovement_lot_idx" ON "InventoryMovement"("lot");

-- CreateIndex
CREATE INDEX "InventoryMovement_actor_idx" ON "InventoryMovement"("actor");

-- CreateIndex
CREATE INDEX "InventoryMovement_approval_idx" ON "InventoryMovement"("approval");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_prescription_key" ON "Order"("prescription");

-- CreateIndex
CREATE INDEX "Order_guestTokenHash_idx" ON "Order"("guestTokenHash");

-- CreateIndex
CREATE INDEX "Order_organization_idx" ON "Order"("organization");

-- CreateIndex
CREATE INDEX "Order_location_idx" ON "Order"("location");

-- CreateIndex
CREATE INDEX "Order_customer_idx" ON "Order"("customer");

-- CreateIndex
CREATE INDEX "Order_patient_idx" ON "Order"("patient");

-- CreateIndex
CREATE INDEX "Order_approval_idx" ON "Order"("approval");

-- CreateIndex
CREATE INDEX "OrderLineItem_order_idx" ON "OrderLineItem"("order");

-- CreateIndex
CREATE INDEX "OrderLineItem_product_idx" ON "OrderLineItem"("product");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "OrganizationMembership_user_idx" ON "OrganizationMembership"("user");

-- CreateIndex
CREATE INDEX "OrganizationMembership_organization_idx" ON "OrganizationMembership"("organization");

-- CreateIndex
CREATE INDEX "OrganizationMembership_location_idx" ON "OrganizationMembership"("location");

-- CreateIndex
CREATE UNIQUE INDEX "PatientProfile_patientNumber_key" ON "PatientProfile"("patientNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PatientProfile_user_key" ON "PatientProfile"("user");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_session_key" ON "Payment"("session");

-- CreateIndex
CREATE INDEX "Payment_externalPaymentId_idx" ON "Payment"("externalPaymentId");

-- CreateIndex
CREATE INDEX "Payment_order_idx" ON "Payment"("order");

-- CreateIndex
CREATE INDEX "Payment_provider_idx" ON "Payment"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentProvider_code_key" ON "PaymentProvider"("code");

-- CreateIndex
CREATE INDEX "PaymentProvider_organization_idx" ON "PaymentProvider"("organization");

-- CreateIndex
CREATE INDEX "PaymentProvider_integrationProvider_idx" ON "PaymentProvider"("integrationProvider");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSession_idempotencyKey_key" ON "PaymentSession"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentSession_cart_idx" ON "PaymentSession"("cart");

-- CreateIndex
CREATE INDEX "PaymentSession_provider_idx" ON "PaymentSession"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyLocation_code_key" ON "PharmacyLocation"("code");

-- CreateIndex
CREATE INDEX "PharmacyLocation_organization_idx" ON "PharmacyLocation"("organization");

-- CreateIndex
CREATE INDEX "Prescriber_npi_idx" ON "Prescriber"("npi");

-- CreateIndex
CREATE INDEX "Prescriber_organization_idx" ON "Prescriber"("organization");

-- CreateIndex
CREATE INDEX "Prescriber_integrationProvider_idx" ON "Prescriber"("integrationProvider");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_prescriptionNumber_key" ON "Prescription"("prescriptionNumber");

-- CreateIndex
CREATE INDEX "Prescription_organization_idx" ON "Prescription"("organization");

-- CreateIndex
CREATE INDEX "Prescription_location_idx" ON "Prescription"("location");

-- CreateIndex
CREATE INDEX "Prescription_patient_idx" ON "Prescription"("patient");

-- CreateIndex
CREATE INDEX "Prescription_prescriber_idx" ON "Prescription"("prescriber");

-- CreateIndex
CREATE INDEX "Prescription_approval_idx" ON "Prescription"("approval");

-- CreateIndex
CREATE INDEX "PrescriptionItem_prescription_idx" ON "PrescriptionItem"("prescription");

-- CreateIndex
CREATE INDEX "PrescriptionItem_drugReference_idx" ON "PrescriptionItem"("drugReference");

-- CreateIndex
CREATE INDEX "PrescriptionItem_product_idx" ON "PrescriptionItem"("product");

-- CreateIndex
CREATE INDEX "PrescriptionReview_prescription_idx" ON "PrescriptionReview"("prescription");

-- CreateIndex
CREATE INDEX "PrescriptionReview_patient_idx" ON "PrescriptionReview"("patient");

-- CreateIndex
CREATE INDEX "PrescriptionReview_pharmacist_idx" ON "PrescriptionReview"("pharmacist");

-- CreateIndex
CREATE INDEX "PrescriptionReview_approval_idx" ON "PrescriptionReview"("approval");

-- CreateIndex
CREATE INDEX "PrescriptionTransfer_patient_idx" ON "PrescriptionTransfer"("patient");

-- CreateIndex
CREATE INDEX "PrescriptionTransfer_prescription_idx" ON "PrescriptionTransfer"("prescription");

-- CreateIndex
CREATE INDEX "PrescriptionTransfer_approval_idx" ON "PrescriptionTransfer"("approval");

-- CreateIndex
CREATE UNIQUE INDEX "Product_handle_key" ON "Product"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_organization_idx" ON "Product"("organization");

-- CreateIndex
CREATE INDEX "Product_location_idx" ON "Product"("location");

-- CreateIndex
CREATE INDEX "Product_drugReference_idx" ON "Product"("drugReference");

-- CreateIndex
CREATE UNIQUE INDEX "Recall_recallNumber_key" ON "Recall"("recallNumber");

-- CreateIndex
CREATE INDEX "Recall_organization_idx" ON "Recall"("organization");

-- CreateIndex
CREATE INDEX "Recall_location_idx" ON "Recall"("location");

-- CreateIndex
CREATE INDEX "Recall_approval_idx" ON "Recall"("approval");

-- CreateIndex
CREATE INDEX "RefillRequest_patient_idx" ON "RefillRequest"("patient");

-- CreateIndex
CREATE INDEX "RefillRequest_prescription_idx" ON "RefillRequest"("prescription");

-- CreateIndex
CREATE INDEX "RefillRequest_location_idx" ON "RefillRequest"("location");

-- CreateIndex
CREATE INDEX "RefillRequest_approval_idx" ON "RefillRequest"("approval");

-- CreateIndex
CREATE INDEX "Supplier_organization_idx" ON "Supplier"("organization");

-- CreateIndex
CREATE INDEX "Supplier_integrationProvider_idx" ON "Supplier"("integrationProvider");

-- CreateIndex
CREATE INDEX "TemperatureExcursion_organization_idx" ON "TemperatureExcursion"("organization");

-- CreateIndex
CREATE INDEX "TemperatureExcursion_location_idx" ON "TemperatureExcursion"("location");

-- CreateIndex
CREATE INDEX "TemperatureExcursion_lot_idx" ON "TemperatureExcursion"("lot");

-- CreateIndex
CREATE INDEX "TemperatureExcursion_reviewedBy_idx" ON "TemperatureExcursion"("reviewedBy");

-- CreateIndex
CREATE INDEX "TemperatureExcursion_approval_idx" ON "TemperatureExcursion"("approval");

-- CreateIndex
CREATE UNIQUE INDEX "_InventoryLot_recalls_AB_unique" ON "_InventoryLot_recalls"("A", "B");

-- CreateIndex
CREATE INDEX "_InventoryLot_recalls_B_index" ON "_InventoryLot_recalls"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Organization_patients_AB_unique" ON "_Organization_patients"("A", "B");

-- CreateIndex
CREATE INDEX "_Organization_patients_B_index" ON "_Organization_patients"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actor_fkey" FOREIGN KEY ("actor") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_patient_fkey" FOREIGN KEY ("patient") REFERENCES "PatientProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_customer_fkey" FOREIGN KEY ("customer") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_order_fkey" FOREIGN KEY ("order") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cart_fkey" FOREIGN KEY ("cart") REFERENCES "Cart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_product_fkey" FOREIGN KEY ("product") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_patient_fkey" FOREIGN KEY ("patient") REFERENCES "PatientProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_actor_fkey" FOREIGN KEY ("actor") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_transfer_fkey" FOREIGN KEY ("transfer") REFERENCES "PrescriptionTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_order_fkey" FOREIGN KEY ("order") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fulfillment" ADD CONSTRAINT "Fulfillment_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fulfillment" ADD CONSTRAINT "Fulfillment_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fulfillment" ADD CONSTRAINT "Fulfillment_order_fkey" FOREIGN KEY ("order") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fulfillment" ADD CONSTRAINT "Fulfillment_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanApproval" ADD CONSTRAINT "HumanApproval_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanApproval" ADD CONSTRAINT "HumanApproval_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanApproval" ADD CONSTRAINT "HumanApproval_actor_fkey" FOREIGN KEY ("actor") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationProvider" ADD CONSTRAINT "IntegrationProvider_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_product_fkey" FOREIGN KEY ("product") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_supplier_fkey" FOREIGN KEY ("supplier") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_product_fkey" FOREIGN KEY ("product") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_lot_fkey" FOREIGN KEY ("lot") REFERENCES "InventoryLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_actor_fkey" FOREIGN KEY ("actor") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_approval_fkey" FOREIGN KEY ("approval") REFERENCES "HumanApproval"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customer_fkey" FOREIGN KEY ("customer") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_patient_fkey" FOREIGN KEY ("patient") REFERENCES "PatientProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_prescription_fkey" FOREIGN KEY ("prescription") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_approval_fkey" FOREIGN KEY ("approval") REFERENCES "HumanApproval"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLineItem" ADD CONSTRAINT "OrderLineItem_order_fkey" FOREIGN KEY ("order") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLineItem" ADD CONSTRAINT "OrderLineItem_product_fkey" FOREIGN KEY ("product") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientProfile" ADD CONSTRAINT "PatientProfile_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_order_fkey" FOREIGN KEY ("order") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_provider_fkey" FOREIGN KEY ("provider") REFERENCES "PaymentProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_session_fkey" FOREIGN KEY ("session") REFERENCES "PaymentSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentProvider" ADD CONSTRAINT "PaymentProvider_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentProvider" ADD CONSTRAINT "PaymentProvider_integrationProvider_fkey" FOREIGN KEY ("integrationProvider") REFERENCES "IntegrationProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSession" ADD CONSTRAINT "PaymentSession_cart_fkey" FOREIGN KEY ("cart") REFERENCES "Cart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSession" ADD CONSTRAINT "PaymentSession_provider_fkey" FOREIGN KEY ("provider") REFERENCES "PaymentProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyLocation" ADD CONSTRAINT "PharmacyLocation_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescriber" ADD CONSTRAINT "Prescriber_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescriber" ADD CONSTRAINT "Prescriber_integrationProvider_fkey" FOREIGN KEY ("integrationProvider") REFERENCES "IntegrationProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patient_fkey" FOREIGN KEY ("patient") REFERENCES "PatientProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_prescriber_fkey" FOREIGN KEY ("prescriber") REFERENCES "Prescriber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_approval_fkey" FOREIGN KEY ("approval") REFERENCES "HumanApproval"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_prescription_fkey" FOREIGN KEY ("prescription") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_drugReference_fkey" FOREIGN KEY ("drugReference") REFERENCES "DrugReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_product_fkey" FOREIGN KEY ("product") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionReview" ADD CONSTRAINT "PrescriptionReview_prescription_fkey" FOREIGN KEY ("prescription") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionReview" ADD CONSTRAINT "PrescriptionReview_patient_fkey" FOREIGN KEY ("patient") REFERENCES "PatientProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionReview" ADD CONSTRAINT "PrescriptionReview_pharmacist_fkey" FOREIGN KEY ("pharmacist") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionReview" ADD CONSTRAINT "PrescriptionReview_approval_fkey" FOREIGN KEY ("approval") REFERENCES "HumanApproval"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionTransfer" ADD CONSTRAINT "PrescriptionTransfer_patient_fkey" FOREIGN KEY ("patient") REFERENCES "PatientProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionTransfer" ADD CONSTRAINT "PrescriptionTransfer_prescription_fkey" FOREIGN KEY ("prescription") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionTransfer" ADD CONSTRAINT "PrescriptionTransfer_approval_fkey" FOREIGN KEY ("approval") REFERENCES "HumanApproval"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_drugReference_fkey" FOREIGN KEY ("drugReference") REFERENCES "DrugReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recall" ADD CONSTRAINT "Recall_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recall" ADD CONSTRAINT "Recall_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recall" ADD CONSTRAINT "Recall_approval_fkey" FOREIGN KEY ("approval") REFERENCES "HumanApproval"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefillRequest" ADD CONSTRAINT "RefillRequest_patient_fkey" FOREIGN KEY ("patient") REFERENCES "PatientProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefillRequest" ADD CONSTRAINT "RefillRequest_prescription_fkey" FOREIGN KEY ("prescription") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefillRequest" ADD CONSTRAINT "RefillRequest_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefillRequest" ADD CONSTRAINT "RefillRequest_approval_fkey" FOREIGN KEY ("approval") REFERENCES "HumanApproval"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_integrationProvider_fkey" FOREIGN KEY ("integrationProvider") REFERENCES "IntegrationProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureExcursion" ADD CONSTRAINT "TemperatureExcursion_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureExcursion" ADD CONSTRAINT "TemperatureExcursion_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureExcursion" ADD CONSTRAINT "TemperatureExcursion_lot_fkey" FOREIGN KEY ("lot") REFERENCES "InventoryLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureExcursion" ADD CONSTRAINT "TemperatureExcursion_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureExcursion" ADD CONSTRAINT "TemperatureExcursion_approval_fkey" FOREIGN KEY ("approval") REFERENCES "HumanApproval"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InventoryLot_recalls" ADD CONSTRAINT "_InventoryLot_recalls_A_fkey" FOREIGN KEY ("A") REFERENCES "InventoryLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InventoryLot_recalls" ADD CONSTRAINT "_InventoryLot_recalls_B_fkey" FOREIGN KEY ("B") REFERENCES "Recall"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Organization_patients" ADD CONSTRAINT "_Organization_patients_A_fkey" FOREIGN KEY ("A") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Organization_patients" ADD CONSTRAINT "_Organization_patients_B_fkey" FOREIGN KEY ("B") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
