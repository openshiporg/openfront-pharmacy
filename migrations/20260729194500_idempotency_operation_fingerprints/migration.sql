-- Nullable expand fields: new application code writes fingerprints for every
-- dispense/refill operation while old replicas remain compatible.
ALTER TABLE "InventoryMovement" ADD COLUMN "requestFingerprint" TEXT;
ALTER TABLE "RefillRequest" ADD COLUMN "requestFingerprint" TEXT;
