import { prisma } from '../db.js';
import { monthRange } from './dates.js';
import { findMonthBudget } from './budget.js';

// Summary of a finished month: saved amount (budget minus expenses) and top 3 categories
export async function buildRecap(user, month) {
  const { start, end } = monthRange(month);
  const where = { userId: user.id, date: { gte: start, lt: end } };

  const [budget, totals, top, answer] = await Promise.all([
    findMonthBudget(user.id, month),
    prisma.transaction.groupBy({ by: ['type'], where, _sum: { amountCents: true } }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { ...where, type: 'EXPENSE' },
      _sum: { amountCents: true },
      orderBy: { _sum: { amountCents: 'desc' } },
      take: 3,
    }),
    prisma.recapAnswer.findUnique({ where: { userId_month: { userId: user.id, month } } }),
  ]);

  const total = (type) => totals.find((t) => t.type === type)?._sum.amountCents ?? 0;
  const spentCents = total('EXPENSE');
  const budgetCents = budget?.amountCents ?? null;
  const difference = budgetCents === null ? null : budgetCents - spentCents;

  return {
    month,
    budgetCents,
    spentCents,
    incomeCents: total('INCOME'),
    savedCents: difference !== null && difference > 0 ? difference : 0,
    overCents: difference !== null && difference < 0 ? -difference : 0,
    topCategories: top.map((c) => ({ categoryId: c.categoryId, amountCents: c._sum.amountCents })),
    answer: answer?.status ?? null,
  };
}
