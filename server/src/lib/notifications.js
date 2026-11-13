import { prisma } from '../db.js';
import { alertLevel, findCategoryLimits, findMonthBudget, spentByCategory } from './budget.js';
import { currentMonth, daysBetween, fromDbDate, monthRange, previousMonth, toDbDate, today } from './dates.js';
import { notificationText } from './notificationTexts.js';
import { sendToUser } from './push.js';
import { buildRecap } from './recap.js';
import { applyDueRecurrences } from './recurrences.js';
import { deleteInactiveAccounts, warnInactiveAccounts } from './inactivity.js';
import { bankEnabled } from './enableBanking.js';
import { syncDueConnections } from './bankSync.js';

// Other notifications wait until this local time, so nobody is woken up
const MORNING = '10:00';

// Current time in the user's time zone, as "HH:MM"
export const localTime = (timeZone) =>
  new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());

// ISO weekday of a "YYYY-MM-DD" day: 1 = Monday ... 7 = Sunday
const weekday = (day) => toDbDate(day).getUTCDay() || 7;

const send = (user, key, params, extra) => sendToUser(user.id, { ...notificationText(user.language, key, params), ...extra });

const hasDevice = async (userId) => (await prisma.pushSubscription.count({ where: { userId } })) > 0;

// Level reached by a budget row this month, or null when its alert was already sent
async function newAlertLevel(budget, month, spentCents) {
  const level = alertLevel(spentCents, budget.amountCents);
  if (!level) return null;
  // The unique row is the lock: only the first request to create it sends the alert
  try {
    await prisma.budgetAlert.create({ data: { budgetId: budget.id, month, threshold: level } });
  } catch (err) {
    if (err.code === 'P2002') return null;
    throw err;
  }
  // Going straight past 100 % also counts as the 80 % alert
  if (level === 100) {
    await prisma.budgetAlert.createMany({ data: [{ budgetId: budget.id, month, threshold: 80 }], skipDuplicates: true });
  }
  return level;
}

const alertParams = (budget, spentCents) => ({
  percent: Math.round((spentCents / budget.amountCents) * 100),
  spentCents,
  limitCents: budget.amountCents,
  remainingCents: budget.amountCents - spentCents,
  overCents: spentCents - budget.amountCents,
});

// 80 % then 100 % alerts of the month budget and of each category limit, each sent once; runs after each expense and in the job
export async function checkBudgetAlerts(user) {
  if (!user.alertsOn || !(await hasDevice(user.id))) return 0;
  const month = currentMonth(user.timezone);
  const { start, end } = monthRange(month);
  const [budget, limits, spent] = await Promise.all([
    findMonthBudget(user.id, month),
    findCategoryLimits(user.id, month),
    spentByCategory(user.id, start, end),
  ]);
  let sent = 0;

  if (budget) {
    const spentCents = Object.values(spent).reduce((total, cents) => total + cents, 0);
    const level = await newAlertLevel(budget, month, spentCents);
    if (level) {
      sent += await send(user, level === 100 ? 'budgetOver' : 'budget80', alertParams(budget, spentCents), { url: '/dashboard', tag: 'budget' });
    }
  }
  for (const limit of limits) {
    const spentCents = spent[limit.categoryId] ?? 0;
    const level = await newAlertLevel(limit, month, spentCents);
    if (!level) continue;
    const params = { ...alertParams(limit, spentCents), categoryId: limit.categoryId };
    // One tag per category so a category alert does not replace another one on the phone
    sent += await send(user, level === 100 ? 'limitOver' : 'limit80', params, { url: '/dashboard', tag: `limit-${limit.categoryId}` });
  }
  return sent;
}

// Evening reminder, skipped when the day already has an expense or "nothing spent"
export async function dailyReminder(user, day, time) {
  if (!user.reminderOn || !user.reminderDays.includes(weekday(day)) || time < user.reminderTime) return 0;
  // Marked before sending so a slow or repeated job never sends it twice
  const claimed = await prisma.user.updateMany({
    where: { id: user.id, OR: [{ lastReminderDate: null }, { lastReminderDate: { lt: toDbDate(day) } }] },
    data: { lastReminderDate: toDbDate(day) },
  });
  if (claimed.count === 0) return 0;

  const date = toDbDate(day);
  const [expenses, check, pending] = await Promise.all([
    prisma.transaction.count({ where: { userId: user.id, type: 'EXPENSE', date } }),
    prisma.dayCheck.findUnique({ where: { userId_date: { userId: user.id, date } } }),
    prisma.bankImport.count({ where: { userId: user.id, status: 'PENDING' } }),
  ]);
  // With a bank linked, the evening message asks to review its operations instead
  if (pending > 0) return send(user, 'bankReview', { count: pending }, { url: '/bank', tag: 'reminder' });
  if (expenses > 0 || check) return 0;
  return send(user, 'reminder', {}, { url: '/transactions/new', tag: 'reminder', day });
}

// Warning a few days before a subscription debit or the end of a free trial
export async function debitReminders(user, day, time) {
  if (time < MORNING) return 0;
  const recurrences = await prisma.recurrence.findMany({
    where: {
      userId: user.id,
      type: 'EXPENSE',
      nextDate: { gt: toDbDate(day) },
      // The user can turn the reminder off at any time, trials included
      remindOn: true,
    },
  });

  let sent = 0;
  for (const r of recurrences) {
    const days = daysBetween(day, fromDbDate(r.nextDate));
    if (days > r.remindDaysBefore) continue;
    const claimed = await prisma.recurrence.updateMany({
      where: { id: r.id, OR: [{ remindedFor: null }, { remindedFor: { not: r.nextDate } }] },
      data: { remindedFor: r.nextDate },
    });
    if (claimed.count === 0) continue;
    const params = { label: r.label, amountCents: r.amountCents, days };
    sent += await send(user, r.trialUntil ? 'trialEnd' : 'debitSoon', params, { url: '/recurrences', tag: `debit-${r.id}` });
  }
  return sent;
}

// Recap of last month during the first 10 days, then the "remind me tomorrow" reminders
export async function recapNotifications(user, day, time) {
  if (time < MORNING) return 0;
  let sent = 0;

  const lastMonth = previousMonth(day.slice(0, 7));
  if (Number(day.slice(8)) <= 10 && user.recapNotifiedFor !== lastMonth) {
    const [budget, answer] = await Promise.all([
      findMonthBudget(user.id, lastMonth),
      prisma.recapAnswer.findUnique({ where: { userId_month: { userId: user.id, month: lastMonth } } }),
    ]);
    const claimed =
      budget && !answer
        ? await prisma.user.updateMany({
            where: { id: user.id, OR: [{ recapNotifiedFor: null }, { recapNotifiedFor: { not: lastMonth } }] },
            data: { recapNotifiedFor: lastMonth },
          })
        : { count: 0 };
    if (claimed.count > 0) {
      const recap = await buildRecap(user, lastMonth);
      sent += await send(user, 'recapReady', { month: lastMonth, savedCents: recap.savedCents }, {
        url: `/recap?month=${lastMonth}`,
        tag: 'recap',
      });
    }
  }

  const later = await prisma.recapAnswer.findMany({
    where: { userId: user.id, status: 'REMIND_LATER', reminded: false, remindDate: { lte: toDbDate(day) } },
  });
  for (const answer of later) {
    const claimed = await prisma.recapAnswer.updateMany({ where: { id: answer.id, reminded: false }, data: { reminded: true } });
    if (claimed.count === 0) continue;
    const recap = await buildRecap(user, answer.month);
    sent += await send(user, 'recapReminder', { month: answer.month, savedCents: recap.savedCents }, {
      url: `/recap?month=${answer.month}`,
      tag: 'recap',
    });
  }
  return sent;
}

// Run every 15 minutes: sends whatever is due for each user who has a device (the steps above are exported for tests)
export async function runJobs() {
  // Accounts unused for 90 days go first, then those close to it are warned
  const deleted = await deleteInactiveAccounts();
  const warned = await warnInactiveAccounts();
  // Linked banks are read in the background every 6 hours, before the evening reminder counts what is waiting
  const imported = bankEnabled() ? await syncDueConnections() : 0;
  const users = await prisma.user.findMany({ where: { pushSubscriptions: { some: {} } } });
  const summary = { users: users.length, sent: warned, errors: 0, deleted, imported };

  for (const user of users) {
    try {
      const day = today(user.timezone);
      const time = localTime(user.timezone);
      await applyDueRecurrences(user);
      if (time >= MORNING) summary.sent += await checkBudgetAlerts(user);
      summary.sent += await dailyReminder(user, day, time);
      summary.sent += await debitReminders(user, day, time);
      summary.sent += await recapNotifications(user, day, time);
    } catch (err) {
      // One broken account must not stop the others
      summary.errors++;
      console.error('Job failed for a user', err);
    }
  }
  return summary;
}
