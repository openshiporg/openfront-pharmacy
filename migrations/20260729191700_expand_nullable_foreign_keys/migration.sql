ALTER TABLE "PaymentSession" DROP CONSTRAINT "PaymentSession_organization_fkey",
  ADD CONSTRAINT "PaymentSession_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentSession" DROP CONSTRAINT "PaymentSession_location_fkey",
  ADD CONSTRAINT "PaymentSession_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_organization_fkey",
  ADD CONSTRAINT "Payment_organization_fkey" FOREIGN KEY ("organization") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_location_fkey",
  ADD CONSTRAINT "Payment_location_fkey" FOREIGN KEY ("location") REFERENCES "PharmacyLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RefillRequest" DROP CONSTRAINT "RefillRequest_prescriptionItem_fkey",
  ADD CONSTRAINT "RefillRequest_prescriptionItem_fkey" FOREIGN KEY ("prescriptionItem") REFERENCES "PrescriptionItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
