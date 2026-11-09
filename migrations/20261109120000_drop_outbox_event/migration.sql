-- Remove the invented outbox machinery. External events use Openfront Commerce webhooks only.
DROP TABLE "OutboxEvent";
