ALTER TABLE "OutboxEvent" ALTER COLUMN "lastError" DROP DEFAULT;
ALTER TABLE "ExternalIntegrationWorkflow" ALTER COLUMN "lastError" DROP DEFAULT;
