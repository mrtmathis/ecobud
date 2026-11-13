import { prisma } from '../db.js';

// Global budget of a month; without one, the latest earlier budget is reused so it only needs setting once
export async function findMonthBudget(userId, month) {
  return prisma.budget.findFirst({
    where: { userId, categoryId: null, month: { lte: month } },
    orderBy: { month: 'desc' },
  });
}

// Category limits of a month: per category the latest earlier row wins, and an amount of 0 means the limit was removed
export async function findCategoryLimits(userId, month) {
  const rows = await prisma.budget.findMany({
    where: { userId, categoryId: { not: null }, month: { lte: month } },
    orderBy: { month: 'desc' },
  });
  const latest = new Map();
  for (const row of rows) if (!latest.has(row.categoryId)) latest.set(row.categoryId, row);
  return [...latest.values()].filter((row) => row.amountCents > 0);
}

// Expenses of a month per category, as { categoryId: cents }
export async function spentByCategory(userId, start, end) {
  const groups = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { userId, type: 'EXPENSE', date: { gte: start, lt: end } },
    _sum: { amountCents: true },
  });
  return Object.fromEntries(groups.map((g) => [g.categoryId, g._sum.amountCents ?? 0]));
}

// 80 when 80 % of the budget is spent, 100 when it is reached or passed
export function alertLevel(spentCents, budgetCents) {
  if (!budgetCents) return null;
  if (spentCents >= budgetCents) return 100;
  if (spentCents >= budgetCents * 0.8) return 80;
  return null;
}
