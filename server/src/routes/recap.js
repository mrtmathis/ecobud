import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { validate } from '../lib/validation.js';
import { currentMonth, previousMonth, toDbDate, today } from '../lib/dates.js';
import { buildRecap } from '../lib/recap.js';
import { applyDueRecurrences } from '../lib/recurrences.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();
router.use(requireAuth);

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

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
  // A new answer also re-arms the reminder notification
  const data = { status, remindDate: status === 'REMIND_LATER' ? tomorrow : null, reminded: false };

  await prisma.recapAnswer.upsert({
    where: { userId_month: { userId: req.user.id, month } },
    update: data,
    create: { ...data, month, userId: req.user.id },
  });
  res.json({ month, answer: status });
});

export default router;
