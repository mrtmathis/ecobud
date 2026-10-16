import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { validate } from '../lib/validation.js';
import { currentMonth, daysBetween, fromDbDate, monthRange, toDbDate, today } from '../lib/dates.js';
import { alertLevel, findMonthBudget } from '../lib/budget.js';
import { applyDueRecurrences } from '../lib/recurrences.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();
router.use(requireAuth);

const querySchema = z.object({ month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional() });
const UPCOMING_DAYS = 30;

// Everything the dashboard shows for one month, computed in a single request
router.get('/', async (req, res) => {
  const { month = currentMonth(req.user.timezone) } = validate(querySchema, req.query);
  await applyDueRecurrences(req.user);

  const now = today(req.user.timezone);
  const { start, end } = monthRange(month);
  const where = { userId: req.user.id, date: { gte: start, lt: end } };
  const horizon = new Date(toDbDate(now).getTime() + UPCOMING_DAYS * 86_400_000);

  const [budget, totals, byCategory, latest, upcoming] = await Promise.all([
    findMonthBudget(req.user.id, month),
    prisma.transaction.groupBy({ by: ['type'], where, _sum: { amountCents: true } }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { ...where, type: 'EXPENSE' },
      _sum: { amountCents: true },
      orderBy: { _sum: { amountCents: 'desc' } },
    }),
    prisma.transaction.findMany({ where, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }], take: 5 }),
    prisma.recurrence.findMany({
      where: { userId: req.user.id, type: 'EXPENSE', nextDate: { lte: horizon } },
      orderBy: { nextDate: 'asc' },
    }),
  ]);

  const total = (type) => totals.find((t) => t.type === type)?._sum.amountCents ?? 0;
  const spentCents = total('EXPENSE');
  const budgetCents = budget?.amountCents ?? null;

  res.json({
    month,
    budgetCents,
    spentCents,
    incomeCents: total('INCOME'),
    remainingCents: budgetCents === null ? null : budgetCents - spentCents,
    percentUsed: budgetCents ? Math.round((spentCents / budgetCents) * 100) : null,
    alertLevel: alertLevel(spentCents, budgetCents),
    byCategory: byCategory.map((c) => ({ categoryId: c.categoryId, amountCents: c._sum.amountCents })),
    latest: latest.map((t) => ({
      id: t.id,
      type: t.type,
      amountCents: t.amountCents,
      date: fromDbDate(t.date),
      categoryId: t.categoryId,
      note: t.note,
    })),
    // Debits of the next 30 days, so the user can cancel a subscription in time
    upcoming: upcoming.map((r) => ({
      id: r.id,
      label: r.label,
      amountCents: r.amountCents,
      nextDate: fromDbDate(r.nextDate),
      daysUntil: daysBetween(now, fromDbDate(r.nextDate)),
      isTrial: Boolean(r.trialUntil),
    })),
  });
});

export default router;
