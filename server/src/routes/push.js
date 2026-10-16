import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { validate } from '../lib/validation.js';
import { notificationText } from '../lib/notificationTexts.js';
import { pushEnabled, sendToUser } from '../lib/push.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

// A user rarely has more devices than this; the oldest ones are dropped
const MAX_DEVICES = 10;

function requirePush() {
  if (!pushEnabled()) throw new HttpError(503, 'PUSH_DISABLED');
}

// Public key the browser needs to subscribe; it is public by design, so no login is needed
router.get('/key', (req, res) => {
  requirePush();
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Everything below needs a logged-in user
router.use(requireAuth);

const endpointSchema = z.url().max(1000).startsWith('https://');
const subscriptionSchema = z.object({
  endpoint: endpointSchema,
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

// Saves this device; an endpoint already known moves to the current user
router.post('/subscribe', async (req, res) => {
  requirePush();
  const { endpoint, keys } = validate(subscriptionSchema, req.body);
  const data = { userId: req.user.id, p256dh: keys.p256dh, auth: keys.auth };
  await prisma.pushSubscription.upsert({ where: { endpoint }, create: { endpoint, ...data }, update: data });

  const extra = await prisma.pushSubscription.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    skip: MAX_DEVICES,
    select: { id: true },
  });
  if (extra.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: extra.map((s) => s.id) } } });
  res.status(201).json({ subscribed: true });
});

router.delete('/subscribe', async (req, res) => {
  const { endpoint } = validate(z.object({ endpoint: endpointSchema }), req.body);
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.user.id } });
  res.status(204).end();
});

// Sends a test notification to every device of the user
router.post('/test', async (req, res) => {
  requirePush();
  const sent = await sendToUser(req.user.id, { ...notificationText(req.user.language, 'test'), url: '/account' });
  if (sent === 0) throw new HttpError(404, 'NO_DEVICE');
  res.json({ sent });
});

export default router;
