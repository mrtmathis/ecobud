-- DropIndex
DROP INDEX "BudgetAlert_budgetId_threshold_key";

-- AlterTable (the table is still empty: no alert has been sent yet)
ALTER TABLE "BudgetAlert" ADD COLUMN "month" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "BudgetAlert_budgetId_month_threshold_key" ON "BudgetAlert"("budgetId", "month", "threshold");
