-- CreateEnum
CREATE TYPE "RecapStatus" AS ENUM ('DONE', 'REMIND_LATER');

-- CreateTable
CREATE TABLE "RecapAnswer" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "status" "RecapStatus" NOT NULL,
    "remindDate" DATE,
    "userId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecapAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecapAnswer_userId_month_key" ON "RecapAnswer"("userId", "month");

-- AddForeignKey
ALTER TABLE "RecapAnswer" ADD CONSTRAINT "RecapAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
