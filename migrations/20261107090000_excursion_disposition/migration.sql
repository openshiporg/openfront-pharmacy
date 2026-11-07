-- TemperatureExcursion: the pharmacist's disposition note and when the excursion was closed.
ALTER TABLE "TemperatureExcursion" ADD COLUMN "resolutionNote" TEXT NOT NULL DEFAULT '',
ADD COLUMN "resolvedAt" TIMESTAMP(3);
