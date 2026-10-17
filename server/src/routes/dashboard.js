import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { validate } from '../lib/validation.js';
import { currentMonth, daysBetween, fromDbDate, monthRange, previousMonth, toDbDate, today } from '../lib/dates.js';
import { alertLevel, findMonthBudget } from '../lib/budget.js';
import { applyDueRecurrences } from '../lib/recurrences.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();
router.use(requireAuth);

const querySchema = z.object({ month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional() });
const UPCOMING_DAYS = 30;
// The streak looks back at most this far
const STREAK_LIMIT = 366;

const shiftDay = (day, days) => fromDbDate(new Date(toDbDate(day).getTime() + days * 86_400_000));

// Spending of the previous month from its 1st to the same day number, for a fair comparison
async function previousMonthSoFar(userId, month, now) {
  const last = previousMonth(month);
  const { start, end } = monthRange(last);
  const daysInLast = Math.round((end - start) / 86_400_000);
  const sameDay = Math.min(Number(now.slice(8)), daysInLast);
  const until = toDbDate(`${last}-${String(sameDay).padStart(2, '0')}`);
  const spent = await prisma.transaction.aggregate({
    where: { userId, type: 'EXPENSE', date: { gte: start, lte: until } },
    _sum: { amountCents: true },
  });
  return { month: last, spentCents: spent._sum.amountCents ?? 0 };
}

// Days in a row with an expense noted or "nothing spent"; today counts once filled, and does not break the run before
async function streakDays(userId, now) {
  const since = toDbDate(shiftDay(now, -STREAK_LIMIT));
  const [expenseDays, checks] = await Promise.all([
    prisma.transaction.findMany({ where: { userId, type: 'EXPENSE', date: { gte: since } }, select: { date: true }, distinct: ['date'] }),
    prisma.dayCheck.findMany({ where: { userId, date: { gte: since } }, select: { date: true } }),
  ]);
  const filled = new Set([...expenseDays, ...checks].map((d) => fromDbDate(d.date)));
  let day = filled.has(now) ? now : shiftDay(now, -1);
  let count = 0;
  while (filled.has(day) && count < STREAK_LIMIT) {
    count++;
    day = shiftDay(day, -1);
  }
  return count;
}

// Everything the dashboard shows for one month, computed in a single request
router.get('/', async (req, res) => {
  const { month = currentMonth(req.user.timezone) } = validate(querySchema, req.query);
  await applyDueRecurrences(req.user);

  const now = today(req.user.timezone);
  const { start, end } = monthRange(month);
  const where = { userId: req.user.id, date: { gte: start, lt: end } };
  const horizon = new Date(toDbDate(now).getTime() + UPCOMING_DAYS * 86_400_000);

  const lastMonth = previousMonth(currentMonth(req.user.timezone));
  const [budget, totals, byCategory, latest, upcoming, todayExpenses, todayCheck, lastBudget, lastAnswer] = await Promise.all([
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
    prisma.transaction.count({ where: { userId: req.user.id, type: 'EXPENSE', date: toDbDate(now) } }),
    prisma.dayCheck.findUnique({ where: { userId_date: { userId: req.user.id, date: toDbDate(now) } } }),
    findMonthBudget(req.user.id, lastMonth),
    prisma.recapAnswer.findUnique({ where: { userId_month: { userId: req.user.id, month: lastMonth } } }),
  ]);

  // The last month recap is offered during the first 10 days, until answered (or until the reminder date)
  const recapWaiting =
    Number(now.slice(8)) <= 10 &&
    Boolean(lastBudget) &&
    (!lastAnswer || (lastAnswer.status === 'REMIND_LATER' && fromDbDate(lastAnswer.remindDate) <= now));

  // Comparison and streak only make sense for the month in progress
  const isCurrent = month === currentMonth(req.user.timezone);
  const [previous, streak] = isCurrent
    ? await Promise.all([previousMonthSoFar(req.user.id, month, now), streakDays(req.user.id, now)])
    : [null, 0];

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
    today: { date: now, expenseCount: todayExpenses, nothingSpent: Boolean(todayCheck) },
    recapMonth: recapWaiting ? lastMonth : null,
    // Spent so far compared with the same day of last month (absent when last month has no expense)
    previous: previous?.spentCents ? previous : null,
    streak,
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
