import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { validate } from '../lib/validation.js';
import { daysBetween, fromDbDate, toDbDate, today } from '../lib/dates.js';
import { applyDueRecurrences } from '../lib/recurrences.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

// Far more than a student needs; it only stops a script from filling the database
const MAX_RECURRENCES = 200;
router.use(requireAuth);

const recurrenceSchema = z.object({
  label: z.string().trim().min(1).max(60),
  type: z.enum(['EXPENSE', 'INCOME']),
  amountCents: z.number().int().positive().max(10_000_000),
  categoryId: z.string().max(40),
  frequency: z.enum(['MONTHLY', 'YEARLY']),
  nextDate: z.iso.date(),
  isTrial: z.boolean().default(false),
  remindOn: z.boolean().default(false),
  remindDaysBefore: z.union([z.literal(1), z.literal(3), z.literal(7)]).default(3),
});

const toJson = (r, now) => {
  const nextDate = fromDbDate(r.nextDate);
  return {
    id: r.id,
    label: r.label,
    type: r.type,
    amountCents: r.amountCents,
    categoryId: r.categoryId,
    frequency: r.frequency,
    nextDate,
    daysUntil: daysBetween(now, nextDate),
    isTrial: Boolean(r.trialUntil),
    remindOn: r.remindOn,
    remindDaysBefore: r.remindDaysBefore,
  };
};

async function checkRecurrence(data, now) {
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category || category.type !== data.type) throw fieldError('categoryId');
  // The next debit is today or later, at most a year (plus a day) ahead
  const limit = new Date(toDbDate(now).getTime() + 366 * 86_400_000).toISOString().slice(0, 10);
  if (data.nextDate < now || data.nextDate > limit) throw fieldError('nextDate');
  if (data.isTrial && data.type !== 'EXPENSE') throw fieldError('isTrial');
}

function fieldError(field) {
  const error = new HttpError(400, 'VALIDATION_ERROR');
  error.fields = [field];
  return error;
}

// Data written to the database from the validated body
const toDb = (data) => ({
  label: data.label,
  type: data.type,
  amountCents: data.amountCents,
  categoryId: data.categoryId,
  frequency: data.frequency,
  nextDate: toDbDate(data.nextDate),
  anchorDay: Number(data.nextDate.slice(8, 10)),
  trialUntil: data.isTrial ? toDbDate(data.nextDate) : null,
  remindOn: data.remindOn,
  remindDaysBefore: data.remindDaysBefore,
  remindedFor: null,
});

async function findOwned(req) {
  const { success, data: id } = z.uuid().safeParse(req.params.id);
  const recurrence = success && (await prisma.recurrence.findFirst({ where: { id, userId: req.user.id } }));
  if (!recurrence) throw new HttpError(404, 'NOT_FOUND');
  return recurrence;
}

router.get('/', async (req, res) => {
  await applyDueRecurrences(req.user);
  const now = today(req.user.timezone);
  const recurrences = await prisma.recurrence.findMany({ where: { userId: req.user.id }, orderBy: { nextDate: 'asc' } });
  res.json({ recurrences: recurrences.map((r) => toJson(r, now)) });
});

router.get('/:id', async (req, res) => {
  res.json({ recurrence: toJson(await findOwned(req), today(req.user.timezone)) });
});

router.post('/', async (req, res) => {
  const data = validate(recurrenceSchema, req.body);
  const now = today(req.user.timezone);
  await checkRecurrence(data, now);
  if ((await prisma.recurrence.count({ where: { userId: req.user.id } })) >= MAX_RECURRENCES) {
    throw new HttpError(409, 'LIMIT_REACHED');
  }
  const recurrence = await prisma.recurrence.create({ data: { ...toDb(data), userId: req.user.id } });
  res.status(201).json({ recurrence: toJson(recurrence, now) });
});

router.put('/:id', async (req, res) => {
  const existing = await findOwned(req);
  const data = validate(recurrenceSchema, req.body);
  const now = today(req.user.timezone);
  await checkRecurrence(data, now);
  const recurrence = await prisma.recurrence.update({ where: { id: existing.id }, data: toDb(data) });
  res.json({ recurrence: toJson(recurrence, now) });
});

// Turns the reminder on or off at any time
router.patch('/:id/reminder', async (req, res) => {
  const existing = await findOwned(req);
  const { remindOn } = validate(z.object({ remindOn: z.boolean() }), req.body);
  const recurrence = await prisma.recurrence.update({ where: { id: existing.id }, data: { remindOn } });
  res.json({ recurrence: toJson(recurrence, today(req.user.timezone)) });
});

// Stops the recurrence; transactions already added stay in the history
router.delete('/:id', async (req, res) => {
  const existing = await findOwned(req);
  await prisma.recurrence.delete({ where: { id: existing.id } });
  res.status(204).end();
});

export default router;
