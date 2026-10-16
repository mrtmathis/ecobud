-- The Recurrence table is still empty: the feature did not exist before this migration
-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "Recurrence" DROP COLUMN "active",
DROP COLUMN "dayOfMonth",
DROP COLUMN "lastMonth",
ADD COLUMN     "anchorDay" INTEGER NOT NULL,
ADD COLUMN     "frequency" "Frequency" NOT NULL,
ADD COLUMN     "nextDate" DATE NOT NULL,
ADD COLUMN     "remindDaysBefore" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "remindOn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "remindedFor" DATE,
ADD COLUMN     "trialUntil" DATE;

