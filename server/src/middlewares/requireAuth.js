import { prisma } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { SESSION_COOKIE, clearSessionCookie, readSessionToken } from '../lib/auth.js';

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

  req.user = user;
  next();
}
