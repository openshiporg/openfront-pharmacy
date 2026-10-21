/*
  Warnings:

  - Made the column `organization` on table `AuditEvent` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization` on table `Cart` required. This step will fail if there are existing NULL values in that column.
  - Made the column `location` on table `Cart` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cart` on table `CartItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `product` on table `CartItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization` on table `Fulfillment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `location` on table `Fulfillment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `order` on table `Fulfillment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization` on table `HumanApproval` required. This step will fail if there are existing NULL values in that column.
  - Made the column `actor` on table `HumanApproval` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization` on table `IntegrationProvider` required. This step will fail if there are existing NULL values in that column.
  - Made the column `product` on table `InventoryLot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `location` on table `InventoryLot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization` on table `InventoryMovement` required. This step will fail if there are existing NULL values in that column.
  - Made the column `location` on table `InventoryMovement` required. This step will fail if there are existing NULL values in that column.
  - Made the column `product` on table `InventoryMovement` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lot` on table `InventoryMovement` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `location` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `order` on table `OrderLineItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `product` on table `OrderLineItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `user` on table `OrganizationMembership` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization` on table `OrganizationMembership` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization` on table `OutboxEvent` required. This step will fail if there are existing NULL values in that column.
  - Made the column `order` on table `Payment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `provider` on table `Payment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `session` on table `Payment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization` on table `PaymentProvider` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cart` on table `PaymentSession` required. This step will fail if there are existing NULL values in that column.
  - Made the column `provider` on table `PaymentSession` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization` on table `PharmacyLocation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization` on table `Prescriber` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization` on table `Prescription` required. This step will fail if there are existing NULL values in that column.
  - Made the column `location` on table `Prescription` required. This step will fail if there are existing NULL values in that column.
  - Made the column `patient` on table `Prescription` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prescriber` on table `Prescription` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prescription` on table `PrescriptionItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `drugReference` on table `PrescriptionItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `product` on table `PrescriptionItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prescription` on table `PrescriptionReview` required. This step will fail if there are existing NULL values in that column.
  - Made the column `patient` on table `PrescriptionReview` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pharmacist` on table `PrescriptionReview` required. This step will fail if there are existing NULL values in that column.
  - Made the column `approval` on table `PrescriptionReview` required. This step will fail if there are existing NULL values in that column.
  - Made the column `patient` on table `PrescriptionTransfer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prescription` on table `PrescriptionTransfer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `location` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization` on table `Recall` required. This step will fail if there are existing NULL values in that column.
  - Made the column `patient` on table `RefillRequest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prescription` on table `RefillRequest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `location` on table `RefillRequest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization` on table `Supplier` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization` on table `TemperatureExcursion` required. This step will fail if there are existing NULL values in that column.
  - Made the column `location` on table `TemperatureExcursion` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lot` on table `TemperatureExcursion` required. This step will fail if there are existing NULL values in that column.
  - Made the column `reviewedBy` on table `TemperatureExcursion` required. This step will fail if there are existing NULL values in that column.
  - Made the column `approval` on table `TemperatureExcursion` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "AuditEvent" DROP CONSTRAINT "AuditEvent_organization_fkey";

-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_location_fkey";

-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_organization_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_cart_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_product_fkey";

-- DropForeignKey
ALTER TABLE "Fulfillment" DROP CONSTRAINT "Fulfillment_location_fkey";

-- DropForeignKey
ALTER TABLE "Fulfillment" DROP CONSTRAINT "Fulfillment_order_fkey";

-- DropForeignKey
ALTER TABLE "Fulfillment" DROP CONSTRAINT "Fulfillment_organization_fkey";

-- DropForeignKey
ALTER TABLE "HumanApproval" DROP CONSTRAINT "HumanApproval_actor_fkey";

-- DropForeignKey
ALTER TABLE "HumanApproval" DROP CONSTRAINT "HumanApproval_organization_fkey";

-- DropForeignKey
ALTER TABLE "IntegrationProvider" DROP CONSTRAINT "IntegrationProvider_organization_fkey";

-- DropForeignKey
ALTER TABLE "InventoryLot" DROP CONSTRAINT "InventoryLot_location_fkey";

-- DropForeignKey
ALTER TABLE "InventoryLot" DROP CONSTRAINT "InventoryLot_product_fkey";

-- DropForeignKey
ALTER TABLE "InventoryMovement" DROP CONSTRAINT "InventoryMovement_location_fkey";

-- DropForeignKey
ALTER TABLE "InventoryMovement" DROP CONSTRAINT "InventoryMovement_lot_fkey";

-- DropForeignKey
ALTER TABLE "InventoryMovement" DROP CONSTRAINT "InventoryMovement_organization_fkey";

-- DropForeignKey
ALTER TABLE "InventoryMovement" DROP CONSTRAINT "InventoryMovement_product_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_location_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_organization_fkey";

-- DropForeignKey
ALTER TABLE "OrderLineItem" DROP CONSTRAINT "OrderLineItem_order_fkey";

-- DropForeignKey
ALTER TABLE "OrderLineItem" DROP CONSTRAINT "OrderLineItem_product_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationMembership" DROP CONSTRAINT "OrganizationMembership_organization_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationMembership" DROP CONSTRAINT "OrganizationMembership_user_fkey";

-- DropForeignKey
ALTER TABLE "OutboxEvent" DROP CONSTRAINT "OutboxEvent_organization_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_order_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_provider_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_session_fkey";

-- DropForeignKey
ALTER TABLE "PaymentProvider" DROP CONSTRAINT "PaymentProvider_organization_fkey";

-- DropForeignKey
ALTER TABLE "PaymentSession" DROP CONSTRAINT "PaymentSession_cart_fkey";

-- DropForeignKey
ALTER TABLE "PaymentSession" DROP CONSTRAINT "PaymentSession_provider_fkey";

-- DropForeignKey
ALTER TABLE "PharmacyLocation" DROP CONSTRAINT "PharmacyLocation_organization_fkey";

-- DropForeignKey
ALTER TABLE "Prescriber" DROP CONSTRAINT "Prescriber_organization_fkey";

-- DropForeignKey
ALTER TABLE "Prescription" DROP CONSTRAINT "Prescription_location_fkey";

-- DropForeignKey
ALTER TABLE "Prescription" DROP CONSTRAINT "Prescription_organization_fkey";

-- DropForeignKey
ALTER TABLE "Prescription" DROP CONSTRAINT "Prescription_patient_fkey";

-- DropForeignKey
ALTER TABLE "Prescription" DROP CONSTRAINT "Prescription_prescriber_fkey";

-- DropForeignKey
ALTER TABLE "PrescriptionItem" DROP CONSTRAINT "PrescriptionItem_drugReference_fkey";

-- DropForeignKey
ALTER TABLE "PrescriptionItem" DROP CONSTRAINT "PrescriptionItem_prescription_fkey";

-- DropForeignKey
ALTER TABLE "PrescriptionItem" DROP CONSTRAINT "PrescriptionItem_product_fkey";

-- DropForeignKey
ALTER TABLE "PrescriptionReview" DROP CONSTRAINT "PrescriptionReview_approval_fkey";

-- DropForeignKey
ALTER TABLE "PrescriptionReview" DROP CONSTRAINT "PrescriptionReview_patient_fkey";

-- DropForeignKey
ALTER TABLE "PrescriptionReview" DROP CONSTRAINT "PrescriptionReview_pharmacist_fkey";

-- DropForeignKey
ALTER TABLE "PrescriptionReview" DROP CONSTRAINT "PrescriptionReview_prescription_fkey";

-- DropForeignKey
ALTER TABLE "PrescriptionTransfer" DROP CONSTRAINT "PrescriptionTransfer_patient_fkey";

-- DropForeignKey
ALTER TABLE "PrescriptionTransfer" DROP CONSTRAINT "PrescriptionTransfer_prescription_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_location_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_organization_fkey";

-- DropForeignKey
ALTER TABLE "Recall" DROP CONSTRAINT "Recall_organization_fkey";

-- DropForeignKey
ALTER TABLE "RefillRequest" DROP CONSTRAINT "RefillRequest_location_fkey";

-- DropForeignKey
ALTER TABLE "RefillRequest" DROP CONSTRAINT "RefillRequest_patient_fkey";

-- DropForeignKey
ALTER TABLE "RefillRequest" DROP CONSTRAINT "RefillRequest_prescription_fkey";

-- DropForeignKey
ALTER TABLE "Supplier" DROP CONSTRAINT "Supplier_organization_fkey";

-- DropForeignKey
ALTER TABLE "TemperatureExcursion" DROP CONSTRAINT "TemperatureExcursion_approval_fkey";

-- DropForeignKey
ALTER TABLE "TemperatureExcursion" DROP CONSTRAINT "TemperatureExcursion_location_fkey";

-- DropForeignKey
ALTER TABLE "TemperatureExcursion" DROP CONSTRAINT "TemperatureExcursion_lot_fkey";

-- DropForeignKey
ALTER TABLE "TemperatureExcursion" DROP CONSTRAINT "TemperatureExcursion_organization_fkey";

-- DropForeignKey
ALTER TABLE "TemperatureExcursion" DROP CONSTRAINT "TemperatureExcursion_reviewedBy_fkey";

-- AlterTable
ALTER TABLE "AuditEvent" ALTER COLUMN "organization" SET NOT NULL;

-- AlterTable
ALTER TABLE "Cart" ALTER COLUMN "organization" SET NOT NULL,
ALTER COLUMN "location" SET NOT NULL;

-- AlterTable
ALTER TABLE "CartItem" ALTER COLUMN "cart" SET NOT NULL,
ALTER COLUMN "product" SET NOT NULL;

-- AlterTable
ALTER TABLE "Fulfillment" ALTER COLUMN "organization" SET NOT NULL,
ALTER COLUMN "location" SET NOT NULL,
ALTER COLUMN "order" SET NOT NULL;

-- AlterTable
ALTER TABLE "HumanApproval" ALTER COLUMN "organization" SET NOT NULL,
ALTER COLUMN "actor" SET NOT NULL;

-- AlterTable
ALTER TABLE "IntegrationProvider" ALTER COLUMN "organization" SET NOT NULL;

-- AlterTable
ALTER TABLE "InventoryLot" ALTER COLUMN "product" SET NOT NULL,
ALTER COLUMN "location" SET NOT NULL;

-- AlterTable
ALTER TABLE "InventoryMovement" ALTER COLUMN "organization" SET NOT NULL,
ALTER COLUMN "location" SET NOT NULL,
ALTER COLUMN "product" SET NOT NULL,
ALTER COLUMN "lot" SET NOT NULL;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "organization" SET NOT NULL,
ALTER COLUMN "location" SET NOT NULL;

-- AlterTable
ALTER TABLE "OrderLineItem" ALTER COLUMN "order" SET NOT NULL,
ALTER COLUMN "product" SET NOT NULL;

-- AlterTable
ALTER TABLE "OrganizationMembership" ALTER COLUMN "user" SET NOT NULL,
ALTER COLUMN "organization" SET NOT NULL;

-- AlterTable
ALTER TABLE "OutboxEvent" ALTER COLUMN "organization" SET NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "order" SET NOT NULL,
ALTER COLUMN "provider" SET NOT NULL,
ALTER COLUMN "session" SET NOT NULL;

-- AlterTable
ALTER TABLE "PaymentProvider" ALTER COLUMN "organization" SET NOT NULL;

-- AlterTable
ALTER TABLE "PaymentSession" ALTER COLUMN "cart" SET NOT NULL,
ALTER COLUMN "provider" SET NOT NULL;

-- AlterTable
ALTER TABLE "PharmacyLocation" ALTER COLUMN "organization" SET NOT NULL;

-- AlterTable
ALTER TABLE "Prescriber" ALTER COLUMN "organization" SET NOT NULL;

-- AlterTable
ALTER TABLE "Prescription" ALTER COLUMN "organization" SET NOT NULL,
ALTER COLUMN "location" SET NOT NULL,
ALTER COLUMN "patient" SET NOT NULL,
ALTER COLUMN "prescriber" SET NOT NULL;

-- AlterTable
ALTER TABLE "PrescriptionItem" ALTER COLUMN "prescription" SET NOT NULL,
ALTER COLUMN "drugReference" SET NOT NULL,
ALTER COLUMN "product" SET NOT NULL;

-- AlterTable
ALTER TABLE "PrescriptionReview" ALTER COLUMN "prescription" SET NOT NULL,
ALTER COLUMN "patient" SET NOT NULL,
ALTER COLUMN "pharmacist" SET NOT NULL,
ALTER COLUMN "approval" SET NOT NULL;

-- AlterTable
ALTER TABLE "PrescriptionTransfer" ALTER COLUMN "patient" SET NOT NULL,
ALTER COLUMN "prescription" SET NOT NULL;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "organization" SET NOT NULL,
ALTER COLUMN "location" SET NOT NULL;

-- AlterTable
ALTER TABLE "Recall" ALTER COLUMN "organization" SET NOT NULL;

-- AlterTable
ALTER TABLE "RefillRequest" ALTER COLUMN "patient" SET NOT NULL,
ALTER COLUMN "prescription" SET NOT NULL,
ALTER COLUMN "location" SET NOT NULL;

-- AlterTable
ALTER TABLE "Supplier" ALTER COLUMN "organization" SET NOT NULL;

-- AlterTable
ALTER TABLE "TemperatureExcursion" ALTER COLUMN "organization" SET NOT NULL,
ALTER COLUMN "location" SET NOT NULL,
ALTER COLUMN "lot" SET NOT NULL,
ALTER COLUMN "reviewedBy" SET NOT NULL,
ALTER COLUMN "approval" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cart_fkey" FOREIGN KEY ("cart") REFERENCES "Cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_product_fkey" FOREIGN KEY ("product") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fulfillment" ADD CONSTRAINT "Fulfillment_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fulfillment" ADD CONSTRAINT "Fulfillment_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fulfillment" ADD CONSTRAINT "Fulfillment_order_fkey" FOREIGN KEY ("order") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanApproval" ADD CONSTRAINT "HumanApproval_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanApproval" ADD CONSTRAINT "HumanApproval_actor_fkey" FOREIGN KEY ("actor") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationProvider" ADD CONSTRAINT "IntegrationProvider_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_product_fkey" FOREIGN KEY ("product") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_product_fkey" FOREIGN KEY ("product") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_lot_fkey" FOREIGN KEY ("lot") REFERENCES "InventoryLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLineItem" ADD CONSTRAINT "OrderLineItem_order_fkey" FOREIGN KEY ("order") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLineItem" ADD CONSTRAINT "OrderLineItem_product_fkey" FOREIGN KEY ("product") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "OutboxEvent_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_order_fkey" FOREIGN KEY ("order") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_provider_fkey" FOREIGN KEY ("provider") REFERENCES "PaymentProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_session_fkey" FOREIGN KEY ("session") REFERENCES "PaymentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentProvider" ADD CONSTRAINT "PaymentProvider_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSession" ADD CONSTRAINT "PaymentSession_cart_fkey" FOREIGN KEY ("cart") REFERENCES "Cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSession" ADD CONSTRAINT "PaymentSession_provider_fkey" FOREIGN KEY ("provider") REFERENCES "PaymentProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyLocation" ADD CONSTRAINT "PharmacyLocation_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescriber" ADD CONSTRAINT "Prescriber_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patient_fkey" FOREIGN KEY ("patient") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_prescriber_fkey" FOREIGN KEY ("prescriber") REFERENCES "Prescriber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_prescription_fkey" FOREIGN KEY ("prescription") REFERENCES "Prescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_drugReference_fkey" FOREIGN KEY ("drugReference") REFERENCES "DrugReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_product_fkey" FOREIGN KEY ("product") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionReview" ADD CONSTRAINT "PrescriptionReview_prescription_fkey" FOREIGN KEY ("prescription") REFERENCES "Prescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionReview" ADD CONSTRAINT "PrescriptionReview_patient_fkey" FOREIGN KEY ("patient") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionReview" ADD CONSTRAINT "PrescriptionReview_pharmacist_fkey" FOREIGN KEY ("pharmacist") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionReview" ADD CONSTRAINT "PrescriptionReview_approval_fkey" FOREIGN KEY ("approval") REFERENCES "HumanApproval"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionTransfer" ADD CONSTRAINT "PrescriptionTransfer_patient_fkey" FOREIGN KEY ("patient") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionTransfer" ADD CONSTRAINT "PrescriptionTransfer_prescription_fkey" FOREIGN KEY ("prescription") REFERENCES "Prescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recall" ADD CONSTRAINT "Recall_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefillRequest" ADD CONSTRAINT "RefillRequest_patient_fkey" FOREIGN KEY ("patient") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefillRequest" ADD CONSTRAINT "RefillRequest_prescription_fkey" FOREIGN KEY ("prescription") REFERENCES "Prescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefillRequest" ADD CONSTRAINT "RefillRequest_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureExcursion" ADD CONSTRAINT "TemperatureExcursion_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureExcursion" ADD CONSTRAINT "TemperatureExcursion_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureExcursion" ADD CONSTRAINT "TemperatureExcursion_lot_fkey" FOREIGN KEY ("lot") REFERENCES "InventoryLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureExcursion" ADD CONSTRAINT "TemperatureExcursion_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureExcursion" ADD CONSTRAINT "TemperatureExcursion_approval_fkey" FOREIGN KEY ("approval") REFERENCES "HumanApproval"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
