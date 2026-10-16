-- CreateEnum
CREATE TYPE "Skin" AS ENUM ('ticket', 'bocal', 'pop');

-- CreateEnum
CREATE TYPE "Appearance" AS ENUM ('auto', 'light', 'dark');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "appearance" "Appearance" NOT NULL DEFAULT 'auto',
ADD COLUMN     "skin" "Skin" NOT NULL DEFAULT 'ticket',
ADD COLUMN     "themeChosen" BOOLEAN NOT NULL DEFAULT false;
