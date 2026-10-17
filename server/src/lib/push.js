import webpush from 'web-push';
import { prisma } from '../db.js';

let configured = false;

// Real push services of Chrome and Android, Safari and iPhone, Firefox, Edge on Windows
const PUSH_HOSTS = ['fcm.googleapis.com', 'android.googleapis.com', 'push.services.mozilla.com', 'push.apple.com', 'notify.windows.com'];

// Only these hosts receive requests from the server, so a forged address cannot make it call another site
export function isPushEndpoint(endpoint) {
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  const host = url.hostname;
  // Local tests use a mock push service on localhost
  if (process.env.NODE_ENV !== 'production' && host === 'localhost') return true;
  return url.protocol === 'https:' && PUSH_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

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
  const subscriptions = (await prisma.pushSubscription.findMany({ where: { userId } })).filter((s) => isPushEndpoint(s.endpoint));
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
