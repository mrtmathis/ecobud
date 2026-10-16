import { rateLimit } from 'express-rate-limit';
import { HttpError } from '../lib/errors.js';

// Blocks requests that change data when they come from another website (CSRF)
export function sameOriginOnly(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && new URL(origin).host !== req.get('host')) {
    throw new HttpError(403, 'FORBIDDEN_ORIGIN');
  }
  next();
}

// 10 failed attempts per 15 minutes per IP on login, signup and password reset
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ error: 'TOO_MANY_ATTEMPTS' }),
});
