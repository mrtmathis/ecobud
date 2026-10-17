import crypto from 'node:crypto';
import { Router } from 'express';
import { HttpError } from '../lib/errors.js';
import { runJobs } from '../lib/notifications.js';

const router = Router();

// Compares hashes so the check takes the same time whatever the given key
const sameSecret = (given, expected) => {
  const hash = (value) => crypto.createHash('sha256').update(value).digest();
  return crypto.timingSafeEqual(hash(given), hash(expected));
};

// Called every 15 minutes by cron-job.org (or by hand from GitHub Actions) with the JOBS_SECRET key
router.post('/run', async (req, res) => {
  const secret = process.env.JOBS_SECRET;
  const given = (req.get('authorization') || '').replace(/^Bearer /, '');
  if (!secret || secret.length < 32 || !sameSecret(given, secret)) throw new HttpError(401, 'UNAUTHENTICATED');
  res.json(await runJobs());
});

export default router;
