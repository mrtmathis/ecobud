/*
  Warnings:

  - You are about to drop the `PasswordResetToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PasswordResetToken" DROP CONSTRAINT "PasswordResetToken_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "recoveryCodeHash" TEXT;

-- DropTable
DROP TABLE "PasswordResetToken";
