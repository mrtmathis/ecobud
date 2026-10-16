import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { validate } from '../lib/validation.js';
import { currentMonth, fromDbDate, monthRange, toDbDate } from '../lib/dates.js';
import { checkBudgetAlerts } from '../lib/notifications.js';
import { applyDueRecurrences } from '../lib/recurrences.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();
router.use(requireAuth);

const MAX_CENTS = 10_000_000; // 100 000 €
const daySchema = z.iso.date();
const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const idSchema = z.uuid();

const transactionSchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME']),
  amountCents: z.number().int().positive().max(MAX_CENTS),
  date: daySchema,
  categoryId: z.string().max(40),
  note: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((note) => note || null),
});

const toJson = (t) => ({
  id: t.id,
  type: t.type,
  amountCents: t.amountCents,
  date: fromDbDate(t.date),
  categoryId: t.categoryId,
  note: t.note,
  recurrenceId: t.recurrenceId,
});

// Checks the rules that depend on the database: category type, mandatory note, date
async function checkTransaction(data) {
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category || category.type !== data.type) throw fieldError('categoryId');
  if (category.requiresNote && !data.note) throw fieldError('note');

  // No future dates (one day of margin for time zones)
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (data.date > tomorrow || data.date < '2000-01-01') throw fieldError('date');
}

// A day marked "nothing spent" is no longer true once an expense is added on it
async function uncheckDay(userId, data) {
  if (data.type !== 'EXPENSE') return;
  await prisma.dayCheck.deleteMany({ where: { userId, date: toDbDate(data.date) } });
}

function fieldError(field) {
  const error = new HttpError(400, 'VALIDATION_ERROR');
  error.fields = [field];
  return error;
}

// Returns the transaction only if it belongs to the logged-in user, otherwise 404
async function findOwned(req) {
  const { success, data: id } = idSchema.safeParse(req.params.id);
  const transaction = success && (await prisma.transaction.findFirst({ where: { id, userId: req.user.id } }));
  if (!transaction) throw new HttpError(404, 'NOT_FOUND');
  return transaction;
}

const listSchema = z.object({
  month: monthSchema.optional(),
  category: z.string().max(40).optional(),
  type: z.enum(['EXPENSE', 'INCOME']).optional(),
  q: z.string().trim().max(100).optional(),
});

router.get('/', async (req, res) => {
  const filters = validate(listSchema, req.query);
  await applyDueRecurrences(req.user);
  const month = filters.month || currentMonth(req.user.timezone);
  const { start, end } = monthRange(month);

  const where = {
    userId: req.user.id,
    date: { gte: start, lt: end },
    ...(filters.category && { categoryId: filters.category }),
    ...(filters.type && { type: filters.type }),
    ...(filters.q && { note: { contains: filters.q, mode: 'insensitive' } }),
  };
  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });

  const sum = (type) => transactions.filter((t) => t.type === type).reduce((total, t) => total + t.amountCents, 0);
  res.json({
    month,
    totals: { expenseCents: sum('EXPENSE'), incomeCents: sum('INCOME') },
    transactions: transactions.map(toJson),
  });
});

router.get('/:id', async (req, res) => {
  res.json({ transaction: toJson(await findOwned(req)) });
});

// A new or changed expense may cross 80 % or 100 % of the budget; a failed alert never blocks the save
async function alertIfOverBudget(user, data) {
  if (data.type !== 'EXPENSE') return;
  try {
    await checkBudgetAlerts(user);
  } catch (err) {
    console.error('Budget alert failed', err);
  }
}

router.post('/', async (req, res) => {
  const data = validate(transactionSchema, req.body);
  await checkTransaction(data);
  const transaction = await prisma.transaction.create({
    data: { ...data, date: toDbDate(data.date), userId: req.user.id },
  });
  await uncheckDay(req.user.id, data);
  await alertIfOverBudget(req.user, data);
  res.status(201).json({ transaction: toJson(transaction) });
});

router.put('/:id', async (req, res) => {
  const existing = await findOwned(req);
  const data = validate(transactionSchema, req.body);
  await checkTransaction(data);
  const transaction = await prisma.transaction.update({
    where: { id: existing.id },
    data: { ...data, date: toDbDate(data.date) },
  });
  await uncheckDay(req.user.id, data);
  await alertIfOverBudget(req.user, data);
  res.json({ transaction: toJson(transaction) });
});

router.delete('/:id', async (req, res) => {
  const existing = await findOwned(req);
  await prisma.transaction.delete({ where: { id: existing.id } });
  res.status(204).end();
});

export default router;
