import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { validate } from '../lib/validation.js';
import { checkPassword, clearSessionCookie } from '../lib/auth.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { authLimiter } from '../middlewares/security.js';

const router = Router();

// Deletes the account and all its data (cascade); the password is asked again in case the session was stolen
router.delete('/', authLimiter, requireAuth, async (req, res) => {
  const { password } = validate(z.object({ password: z.string().min(1).max(128) }), req.body);
  if (!(await checkPassword(password, req.user.passwordHash))) throw new HttpError(401, 'INVALID_PASSWORD');

  await prisma.user.delete({ where: { id: req.user.id } });
  clearSessionCookie(res);
  res.status(204).end();
});

export default router;
