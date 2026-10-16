import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { validate } from '../lib/validation.js';
import { currentMonth, fromDbDate, monthRange } from '../lib/dates.js';
import { alertLevel, findMonthBudget } from '../lib/budget.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();
router.use(requireAuth);

const querySchema = z.object({ month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional() });

// Everything the dashboard shows for one month, computed in a single request
router.get('/', async (req, res) => {
  const { month = currentMonth(req.user.timezone) } = validate(querySchema, req.query);
  const { start, end } = monthRange(month);
  const where = { userId: req.user.id, date: { gte: start, lt: end } };

  const [budget, totals, byCategory, latest] = await Promise.all([
    findMonthBudget(req.user.id, month),
    prisma.transaction.groupBy({ by: ['type'], where, _sum: { amountCents: true } }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { ...where, type: 'EXPENSE' },
      _sum: { amountCents: true },
      orderBy: { _sum: { amountCents: 'desc' } },
    }),
    prisma.transaction.findMany({ where, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }], take: 5 }),
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
  });
});

export default router;
