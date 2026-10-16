import webpush from 'web-push';
import { prisma } from '../db.js';

let configured = false;

// Keys come from the environment; without them notifications are simply turned off
export function pushEnabled() {
  if (!configured && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'https://github.com/mrtmathis/ecobud',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );
    configured = true;
  }
  return configured;
}

// Sends a notification to every device of a user and removes the devices that no longer exist
export async function sendToUser(userId, notification) {
  if (!pushEnabled()) return 0;
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  const payload = JSON.stringify(notification);
  let sent = 0;

  await Promise.all(
    subscriptions.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
          TTL: 12 * 3600,
        });
        sent++;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.deleteMany({ where: { id: s.id } });
        } else {
          console.error('Push failed', err.statusCode || err.code || err.message);
        }
      }
    }),
  );
  return sent;
}
