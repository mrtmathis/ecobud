import { prisma } from '../db.js';

// Global budget of a month; without one, the latest earlier budget is reused so it only needs setting once
export async function findMonthBudget(userId, month) {
  return prisma.budget.findFirst({
    where: { userId, categoryId: null, month: { lte: month } },
    orderBy: { month: 'desc' },
  });
}

// 80 when 80 % of the budget is spent, 100 when it is reached or passed
export function alertLevel(spentCents, budgetCents) {
  if (!budgetCents) return null;
  if (spentCents >= budgetCents) return 100;
  if (spentCents >= budgetCents * 0.8) return 80;
  return null;
}
