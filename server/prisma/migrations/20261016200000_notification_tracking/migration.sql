-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastReminderDate" DATE,
ADD COLUMN     "recapNotifiedFor" TEXT;

-- AlterTable
ALTER TABLE "RecapAnswer" ADD COLUMN     "reminded" BOOLEAN NOT NULL DEFAULT false;
