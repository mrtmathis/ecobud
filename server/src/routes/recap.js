import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { validate } from '../lib/validation.js';
import { currentMonth, monthRange, previousMonth, toDbDate, today } from '../lib/dates.js';
import { findMonthBudget } from '../lib/budget.js';
import { applyDueRecurrences } from '../lib/recurrences.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();
router.use(requireAuth);

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

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

// Defaults to the last finished month; the current month cannot be summed up yet
router.get('/', async (req, res) => {
  const thisMonth = currentMonth(req.user.timezone);
  const { month = previousMonth(thisMonth) } = validate(z.object({ month: monthSchema.optional() }), req.query);
  if (month >= thisMonth) throw new HttpError(400, 'MONTH_NOT_FINISHED');

  await applyDueRecurrences(req.user);
  res.json({ recap: await buildRecap(req.user, month) });
});

// "Done" or "remind me tomorrow" for the savings suggestion
router.put('/:month/answer', async (req, res) => {
  const month = validate(monthSchema, req.params.month);
  const { status } = validate(z.object({ status: z.enum(['DONE', 'REMIND_LATER']) }), req.body);
  if (month >= currentMonth(req.user.timezone)) throw new HttpError(400, 'MONTH_NOT_FINISHED');

  const tomorrow = toDbDate(today(req.user.timezone));
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const data = { status, remindDate: status === 'REMIND_LATER' ? tomorrow : null };

  await prisma.recapAnswer.upsert({
    where: { userId_month: { userId: req.user.id, month } },
    update: data,
    create: { ...data, month, userId: req.user.id },
  });
  res.json({ month, answer: status });
});

export default router;
