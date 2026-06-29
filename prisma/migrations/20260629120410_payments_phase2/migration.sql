/*
  Warnings:

  - You are about to drop the column `settlementId` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `settlementId` on the `Loan` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_REGISTERED';

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_settlementId_fkey";

-- DropForeignKey
ALTER TABLE "Loan" DROP CONSTRAINT "Loan_settlementId_fkey";

-- AlterTable
ALTER TABLE "Expense" DROP COLUMN "settlementId";

-- AlterTable
ALTER TABLE "Loan" DROP COLUMN "settlementId";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "settlementId" TEXT;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
