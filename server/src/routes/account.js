import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { validate } from '../lib/validation.js';
import { checkPassword, clearSessionCookie } from '../lib/auth.js';
import { fromDbDate } from '../lib/dates.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { authLimiter } from '../middlewares/security.js';

const router = Router();

// Deletes the account and all its data (cascade); the password is asked again in case the session was stolen
router.delete('/', authLimiter, requireAuth, async (req, res) => {
  const { password } = validate(z.object({ password: z.string().min(1).max(128) }), req.body);
  if (!(await checkPassword(password, req.user.passwordHash))) throw new HttpError(401, 'INVALID_PASSWORD');

  await prisma.user.delete({ where: { id: req.user.id } });
  clearSessionCookie(res);
  res.status(204).end();
});

const euros = (cents) => cents / 100;

// Every piece of data kept about the user, as a JSON file (right to data portability); secrets are left out
router.get('/export', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const [transactions, recurrences, budgets, recapAnswers, dayChecks, devices] = await Promise.all([
    prisma.transaction.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
    prisma.recurrence.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.budget.findMany({ where: { userId }, orderBy: { month: 'asc' } }),
    prisma.recapAnswer.findMany({ where: { userId }, orderBy: { month: 'asc' } }),
    prisma.dayCheck.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
    prisma.pushSubscription.findMany({ where: { userId }, select: { createdAt: true } }),
  ]);
  const u = req.user;

  res.attachment('ecobud-data.json');
  res.json({
    exportedAt: new Date().toISOString(),
    account: { name: u.name, email: u.email, createdAt: u.createdAt, lastActiveAt: u.lastActiveAt },
    settings: {
      language: u.language,
      timezone: u.timezone,
      theme: u.skin,
      appearance: u.appearance,
      reminder: { on: u.reminderOn, time: u.reminderTime, days: u.reminderDays },
      budgetAlerts: u.alertsOn,
    },
    transactions: transactions.map((t) => ({
      date: fromDbDate(t.date),
      type: t.type,
      amount: euros(t.amountCents),
      category: t.categoryId,
      note: t.note,
      fromRecurrence: Boolean(t.recurrenceId),
    })),
    recurrences: recurrences.map((r) => ({
      label: r.label,
      type: r.type,
      amount: euros(r.amountCents),
      category: r.categoryId,
      frequency: r.frequency,
      nextDate: fromDbDate(r.nextDate),
      freeTrialUntil: r.trialUntil && fromDbDate(r.trialUntil),
      reminder: r.remindOn ? r.remindDaysBefore : null,
    })),
    budgets: budgets.map((b) => ({ month: b.month, amount: euros(b.amountCents) })),
    recapAnswers: recapAnswers.map((a) => ({ month: a.month, status: a.status })),
    nothingSpentDays: dayChecks.map((d) => fromDbDate(d.date)),
    notificationDevices: devices.map((d) => ({ addedAt: d.createdAt })),
  });
});

export default router;
