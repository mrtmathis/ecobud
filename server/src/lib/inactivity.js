import { prisma } from '../db.js';
import { notificationText } from './notificationTexts.js';
import { sendToUser } from './push.js';

const DAY = 86_400_000;
// Accounts unused for this long are deleted with all their data
export const INACTIVE_DAYS = 90;
// Users with a device are warned this many days before
const WARNING_DAYS = 7;

const daysAgo = (now, days) => new Date(now.getTime() - days * DAY);

// Deletes the accounts nobody used for 90 days; their data goes with them (cascade)
export async function deleteInactiveAccounts(now = new Date()) {
  const { count } = await prisma.user.deleteMany({ where: { lastActiveAt: { lt: daysAgo(now, INACTIVE_DAYS) } } });
  return count;
}

// One notification a week before the deletion; the next visit clears it
export async function warnInactiveAccounts(now = new Date()) {
  const users = await prisma.user.findMany({
    where: {
      lastActiveAt: { lt: daysAgo(now, INACTIVE_DAYS - WARNING_DAYS) },
      inactivityWarnedAt: null,
      pushSubscriptions: { some: {} },
    },
  });
  let sent = 0;
  for (const user of users) {
    // Claimed first, so two runs at the same time send it only once
    const claim = await prisma.user.updateMany({ where: { id: user.id, inactivityWarnedAt: null }, data: { inactivityWarnedAt: now } });
    if (!claim.count) continue;
    const days = Math.max(1, INACTIVE_DAYS - Math.floor((now - user.lastActiveAt) / DAY));
    sent += await sendToUser(user.id, { ...notificationText(user.language, 'inactivity', { days }), url: '/dashboard', tag: 'inactivity' });
  }
  return sent;
}
