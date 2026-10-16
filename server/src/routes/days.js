import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { validate } from '../lib/validation.js';
import { toDbDate, today } from '../lib/dates.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();
router.use(requireAuth);

// A past or current day, in the user's time zone
function parseDay(req) {
  const day = validate(z.iso.date(), req.params.date);
  if (day > today(req.user.timezone) || day < '2000-01-01') {
    const error = new HttpError(400, 'VALIDATION_ERROR');
    error.fields = ['date'];
    throw error;
  }
  return day;
}

// "Nothing spent today": refused if the day already has an expense
router.post('/:date/empty', async (req, res) => {
  const day = parseDay(req);
  const date = toDbDate(day);
  const expenses = await prisma.transaction.count({ where: { userId: req.user.id, type: 'EXPENSE', date } });
  if (expenses > 0) throw new HttpError(409, 'DAY_HAS_EXPENSES');

  await prisma.dayCheck.upsert({
    where: { userId_date: { userId: req.user.id, date } },
    update: {},
    create: { userId: req.user.id, date },
  });
  res.json({ date: day, checked: true });
});

router.delete('/:date/empty', async (req, res) => {
  const day = parseDay(req);
  await prisma.dayCheck.deleteMany({ where: { userId: req.user.id, date: toDbDate(day) } });
  res.json({ date: day, checked: false });
});

export default router;
