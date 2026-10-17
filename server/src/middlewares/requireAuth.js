import { prisma } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { SESSION_COOKIE, clearSessionCookie, readSessionToken } from '../lib/auth.js';

const ACTIVITY_STEP = 12 * 60 * 60 * 1000;

// Loads the logged-in user into req.user, or answers 401
export async function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) throw new HttpError(401, 'UNAUTHENTICATED');

  let payload;
  try {
    payload = readSessionToken(token);
  } catch {
    clearSessionCookie(res);
    throw new HttpError(401, 'UNAUTHENTICATED');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  // Deleted account, or session created before the last password change
  if (!user || payload.iat * 1000 < user.passwordChangedAt.getTime() - 1000) {
    clearSessionCookie(res);
    throw new HttpError(401, 'UNAUTHENTICATED');
  }

  // Remembers the visit, at most every 12 hours, so an account in use is never deleted as inactive
  if (Date.now() - user.lastActiveAt.getTime() > ACTIVITY_STEP) {
    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date(), inactivityWarnedAt: null } });
  }

  req.user = user;
  next();
}
