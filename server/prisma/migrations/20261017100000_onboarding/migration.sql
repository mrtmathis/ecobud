-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingDone" BOOLEAN NOT NULL DEFAULT false;

-- Accounts that already picked a theme have set up the app, so the guide is not forced on them
UPDATE "User" SET "onboardingDone" = true WHERE "themeChosen" = true;
