-- Record invariants the commands already keep, enforced by the database as a backstop. Every constraint was
-- checked against production first (0 violations). Commands refuse with readable messages before these fire.

-- Money: carts and orders sum, nothing negative, currency is an ISO code.
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_totals_check" CHECK (
  "subtotalAmount" IS NOT NULL AND "taxAmount" IS NOT NULL AND "deliveryAmount" IS NOT NULL AND "totalAmount" IS NOT NULL
  AND "subtotalAmount" >= 0 AND "taxAmount" >= 0 AND "deliveryAmount" >= 0
  AND "totalAmount" = "subtotalAmount" + "taxAmount" + "deliveryAmount"
);
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_amounts_check" CHECK ("quantity" BETWEEN 1 AND 99 AND "unitPriceAmount" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_totals_check" CHECK (
  "subtotalAmount" >= 0 AND "taxAmount" >= 0 AND "deliveryAmount" >= 0
  AND "totalAmount" = "subtotalAmount" + "taxAmount" + "deliveryAmount"
  AND "currencyCode" ~ '^[A-Z]{3}$'
);
ALTER TABLE "OrderLineItem" ADD CONSTRAINT "OrderLineItem_amounts_check" CHECK (
  "quantity" >= 1 AND "unitPriceAmount" >= 0 AND "lineTotalAmount" = "unitPriceAmount" * "quantity"
);
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_amounts_check" CHECK (
  "amount" >= 0 AND "currencyCode" ~ '^[A-Z]{3}$'
  AND ("cashReceivedAmount" IS NULL OR "cashReceivedAmount" >= 0)
  AND ("changeDueAmount" IS NULL OR "changeDueAmount" >= 0)
  AND ("cashReceivedAmount" IS NULL OR "changeDueAmount" IS NULL OR "cashReceivedAmount" - "changeDueAmount" = "amount")
);
ALTER TABLE "PaymentSession" ADD CONSTRAINT "PaymentSession_amounts_check" CHECK (
  "amount" >= 0 AND ("reconciliationAttempts" IS NULL OR "reconciliationAttempts" >= 0)
);
ALTER TABLE "Product" ADD CONSTRAINT "Product_price_check" CHECK ("priceAmount" >= 0 AND "currencyCode" ~ '^[A-Z]{3}$');
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_policy_check" CHECK (
  "willCallReturnDays" BETWEEN 1 AND 60 AND ("cashTaxRateBps" IS NULL OR "cashTaxRateBps" BETWEEN 0 AND 10000)
);

-- Inventory: no negative stock, quarantine never exceeds what is on hand, cold-chain lots carry a real range,
-- and movement signs match their meaning.
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_quantities_check" CHECK (
  "quantityReceived" >= 0 AND "quantityAvailable" >= 0 AND "quantityQuarantined" >= 0
  AND "quantityQuarantined" <= "quantityAvailable"
  AND btrim("lotNumber") <> ''
  AND ("minimumTemperatureC" IS NULL OR "maximumTemperatureC" IS NULL OR "minimumTemperatureC" < "maximumTemperatureC")
  AND (NOT "coldChainRequired" OR ("minimumTemperatureC" IS NOT NULL AND "maximumTemperatureC" IS NOT NULL))
);
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_sign_check" CHECK (
  CASE "movementType"
    WHEN 'receive' THEN "quantityDelta" > 0
    WHEN 'return' THEN "quantityDelta" > 0
    WHEN 'sale' THEN "quantityDelta" < 0
    WHEN 'dispense' THEN "quantityDelta" < 0
    WHEN 'destroy' THEN "quantityDelta" < 0
    WHEN 'recall' THEN "quantityDelta" = 0
    WHEN 'quarantine' THEN "quantityDelta" = 0
    ELSE true
  END
);
-- One lot record per product, location and manufacturer lot number (normalised), so a recall or count sees all of it.
CREATE UNIQUE INDEX "InventoryLot_product_location_lotNumber_key"
  ON "InventoryLot" ("product", "location", upper(regexp_replace(btrim("lotNumber"), '[[:space:]]+', ' ', 'g')));

-- Prescriptions: fills never account for more than they authorised; refill counters stay inside the authorisation.
ALTER TABLE "PrescriptionFill" ADD CONSTRAINT "PrescriptionFill_quantities_check" CHECK (
  "authorizedQuantity" >= 1 AND "quantityDispensed" >= 0 AND "quantityReleased" >= 0
  AND "quantityDispensed" + "quantityReleased" <= "authorizedQuantity"
  AND "fillNumber" >= 1 AND "version" >= 0
);
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_refills_check" CHECK (
  "quantityPrescribed" >= 1
  AND ("quantityDispensed" IS NULL OR "quantityDispensed" >= 0)
  AND ("daysSupply" IS NULL OR "daysSupply" >= 1)
  AND ("refillsAuthorized" IS NULL OR "refillsAuthorized" >= 0)
  AND ("refillsReserved" IS NULL OR "refillsReserved" >= 0)
  AND ("refillsRemaining" IS NULL OR "refillsRemaining" >= COALESCE("refillsReserved", 0))
  AND ("refillsRemaining" IS NULL OR "refillsRemaining" <= COALESCE("refillsAuthorized", 0))
);
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_dates_check" CHECK (
  "writtenAt" IS NULL OR "expiresAt" IS NULL OR "expiresAt" > "writtenAt"
);

-- Time and measurements.
ALTER TABLE "TemperatureExcursion" ADD CONSTRAINT "TemperatureExcursion_window_check" CHECK (
  "observedMinimumC" <= "observedMaximumC" AND ("endedAt" IS NULL OR "endedAt" >= "startedAt")
);
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "OutboxEvent_attempts_check" CHECK ("attempts" >= 0);
