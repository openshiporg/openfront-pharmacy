-- DropForeignKey
ALTER TABLE "DispensingLabel" DROP CONSTRAINT "DispensingLabel_order_fkey";

-- AlterTable
ALTER TABLE "DispensingLabel" ADD COLUMN     "fill" TEXT,
ADD COLUMN     "voidReason" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "voidedAt" TIMESTAMP(3),
ALTER COLUMN "order" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "DispensingLabel_fill_idx" ON "DispensingLabel"("fill");

-- AddForeignKey
ALTER TABLE "DispensingLabel" ADD CONSTRAINT "DispensingLabel_order_fkey" FOREIGN KEY ("order") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingLabel" ADD CONSTRAINT "DispensingLabel_fill_fkey" FOREIGN KEY ("fill") REFERENCES "PrescriptionFill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

