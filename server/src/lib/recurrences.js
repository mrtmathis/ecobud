import { prisma } from '../db.js';
import { fromDbDate, toDbDate, today } from './dates.js';

const daysInMonth = (year, monthIndex) => new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

// Next debit after `day`, keeping the anchor day (the 31st falls back to the 30th or 28th in short months)
export function nextDebit(day, frequency, anchorDay) {
  const [y, m] = day.split('-').map(Number);
  const year = frequency === 'YEARLY' ? y + 1 : m === 12 ? y + 1 : y;
  const monthIndex = frequency === 'YEARLY' ? m - 1 : m % 12;
  const d = Math.min(anchorDay, daysInMonth(year, monthIndex));
  return fromDbDate(new Date(Date.UTC(year, monthIndex, d)));
}

// Adds every debit that is due (up to today) as a transaction, then moves nextDate forward
export async function applyDueRecurrences(user) {
  const now = today(user.timezone);
  const due = await prisma.recurrence.findMany({ where: { userId: user.id, nextDate: { lte: toDbDate(now) } } });

  for (const recurrence of due) {
    let day = fromDbDate(recurrence.nextDate);
    while (day <= now) {
      const next = nextDebit(day, recurrence.frequency, recurrence.anchorDay);
      // Only the request that moves nextDate adds the transaction, so two open tabs cannot add it twice
      await prisma.$transaction(async (tx) => {
        const moved = await tx.recurrence.updateMany({
          where: { id: recurrence.id, nextDate: toDbDate(day) },
          data: { nextDate: toDbDate(next), trialUntil: null },
        });
        if (moved.count === 0) return;
        await tx.transaction.create({
          data: {
            type: recurrence.type,
            amountCents: recurrence.amountCents,
            date: toDbDate(day),
            categoryId: recurrence.categoryId,
            note: recurrence.label,
            userId: user.id,
            recurrenceId: recurrence.id,
          },
        });
      });
      day = next;
    }
  }
}
