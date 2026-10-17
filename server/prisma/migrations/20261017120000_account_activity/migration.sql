-- AlterTable: existing accounts start counting their inactivity from now
ALTER TABLE "User" ADD COLUMN     "inactivityWarnedAt" TIMESTAMP(3),
ADD COLUMN     "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
