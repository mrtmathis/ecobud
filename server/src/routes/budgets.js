import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { validate } from '../lib/validation.js';
import { currentMonth } from '../lib/dates.js';
import { findMonthBudget } from '../lib/budget.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();
router.use(requireAuth);

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

const toJson = (budget, month) =>
  budget && { amountCents: budget.amountCents, month: budget.month, inherited: budget.month !== month };

router.get('/', async (req, res) => {
  const { month = currentMonth(req.user.timezone) } = validate(z.object({ month: monthSchema.optional() }), req.query);
  const budget = await findMonthBudget(req.user.id, month);
  res.json({ month, budget: toJson(budget, month) });
});

const budgetSchema = z.object({
  month: monthSchema,
  amountCents: z.number().int().positive().max(10_000_000),
});

// Sets the global budget of a month (it also applies to the following months until changed)
router.put('/', async (req, res) => {
  const { month, amountCents } = validate(budgetSchema, req.body);
  const existing = await prisma.budget.findFirst({ where: { userId: req.user.id, categoryId: null, month } });

  const budget = existing
    ? await prisma.budget.update({ where: { id: existing.id }, data: { amountCents } })
    : await prisma.budget.create({ data: { userId: req.user.id, month, amountCents } });

  // A new amount restarts the alerts of that month
  if (existing && existing.amountCents !== amountCents) {
    await prisma.budgetAlert.deleteMany({ where: { budgetId: budget.id, month } });
  }
  res.json({ month, budget: toJson(budget, month) });
});

export default router;
