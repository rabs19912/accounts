-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'GROUP_DELETE_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'GROUP_DELETE_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'GROUP_DELETE_REJECTED';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "groupId" TEXT;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
