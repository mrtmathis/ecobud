import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { validate } from '../lib/validation.js';
import { currentMonth, monthRange } from '../lib/dates.js';
import { alertLevel, findCategoryLimits, findMonthBudget, spentByCategory } from '../lib/budget.js';
import { HttpError } from '../lib/errors.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();
router.use(requireAuth);

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

const toJson = (budget, month) =>
  budget && { amountCents: budget.amountCents, month: budget.month, inherited: budget.month !== month };

// Income of the month and what recurring expenses take from it: amounts already added plus those still to come
async function monthPlan(userId, month) {
  const { start, end } = monthRange(month);
  const inMonth = { gte: start, lt: end };
  const [incomes, recurringExpenses, recurrences] = await Promise.all([
    prisma.transaction.aggregate({ where: { userId, type: 'INCOME', date: inMonth }, _sum: { amountCents: true } }),
    prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE', recurrenceId: { not: null }, date: inMonth },
      _sum: { amountCents: true },
    }),
    prisma.recurrence.findMany({ where: { userId, nextDate: { lt: end } }, select: { type: true, amountCents: true, frequency: true, nextDate: true } }),
  ]);
  // Still to come in that month: a monthly item due before its end comes back once in it, a yearly one only if due inside it
  const upcoming = (type) =>
    recurrences
      .filter((r) => r.type === type && (r.frequency === 'MONTHLY' || r.nextDate >= start))
      .reduce((total, r) => total + r.amountCents, 0);
  return {
    incomeCents: (incomes._sum.amountCents ?? 0) + upcoming('INCOME'),
    recurringExpenseCents: (recurringExpenses._sum.amountCents ?? 0) + upcoming('EXPENSE'),
  };
}

router.get('/', async (req, res) => {
  const { month = currentMonth(req.user.timezone) } = validate(z.object({ month: monthSchema.optional() }), req.query);
  const [budget, plan] = await Promise.all([findMonthBudget(req.user.id, month), monthPlan(req.user.id, month)]);
  res.json({ month, budget: toJson(budget, month), plan });
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

// ---------- Limits per expense category ----------

const limitSchema = budgetSchema.extend({ categoryId: z.string().min(1).max(40) });
const removeSchema = z.object({ month: monthSchema });

// Limits apply to expense categories only
async function checkExpenseCategory(categoryId) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (category?.type !== 'EXPENSE') {
    const error = new HttpError(400, 'VALIDATION_ERROR');
    error.fields = ['categoryId'];
    throw error;
  }
}

// Writes the limit row of that month (0 = removed from that month on) and restarts its alerts when the amount changes
async function setLimit(userId, month, categoryId, amountCents) {
  const existing = await prisma.budget.findFirst({ where: { userId, categoryId, month } });
  if (existing) {
    await prisma.budget.update({ where: { id: existing.id }, data: { amountCents } });
    if (existing.amountCents !== amountCents) await prisma.budgetAlert.deleteMany({ where: { budgetId: existing.id, month } });
  } else {
    await prisma.budget.create({ data: { userId, month, categoryId, amountCents } });
  }
}

async function limitsJson(userId, month) {
  const { start, end } = monthRange(month);
  const [limits, spent] = await Promise.all([findCategoryLimits(userId, month), spentByCategory(userId, start, end)]);
  return limits.map((l) => ({
    categoryId: l.categoryId,
    amountCents: l.amountCents,
    spentCents: spent[l.categoryId] ?? 0,
    alertLevel: alertLevel(spent[l.categoryId] ?? 0, l.amountCents),
    inherited: l.month !== month,
  }));
}

router.get('/categories', async (req, res) => {
  const { month = currentMonth(req.user.timezone) } = validate(z.object({ month: monthSchema.optional() }), req.query);
  res.json({ month, limits: await limitsJson(req.user.id, month) });
});

// Sets the limit of a category from that month on
router.put('/categories', async (req, res) => {
  const { month, categoryId, amountCents } = validate(limitSchema, req.body);
  await checkExpenseCategory(categoryId);
  await setLimit(req.user.id, month, categoryId, amountCents);
  res.json({ month, limits: await limitsJson(req.user.id, month) });
});

// Removes the limit of a category from that month on; earlier months keep theirs
router.delete('/categories/:categoryId', async (req, res) => {
  const { month } = validate(removeSchema, req.query);
  await checkExpenseCategory(req.params.categoryId);
  await setLimit(req.user.id, month, req.params.categoryId, 0);
  res.json({ month, limits: await limitsJson(req.user.id, month) });
});

export default router;
