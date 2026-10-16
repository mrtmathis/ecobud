import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { emailSchema, passwordSchema, validate } from '../lib/validation.js';
import {
  DUMMY_HASH,
  checkPassword,
  clearSessionCookie,
  generateRecoveryCode,
  hashPassword,
  normalizeRecoveryCode,
  publicUser,
  setSessionCookie,
} from '../lib/auth.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { authLimiter } from '../middlewares/security.js';

const router = Router();

// Creates a new recovery code; the plain code is returned once and only its hash is kept
async function newRecoveryCode() {
  const code = generateRecoveryCode();
  return { code, hash: await hashPassword(normalizeRecoveryCode(code)) };
}

const registerSchema = z.object({
  name: z.string().trim().min(1).max(60),
  email: emailSchema,
  password: passwordSchema,
  language: z.enum(['fr', 'en']).default('fr'),
});

router.post('/register', authLimiter, async (req, res) => {
  const data = validate(registerSchema, req.body);
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new HttpError(409, 'EMAIL_TAKEN');

  const recovery = await newRecoveryCode();
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      language: data.language,
      passwordHash: await hashPassword(data.password),
      recoveryCodeHash: recovery.hash,
    },
  });
  setSessionCookie(res, user.id);
  res.status(201).json({ user: publicUser(user), recoveryCode: recovery.code });
});

const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128) });

router.post('/login', authLimiter, async (req, res) => {
  const data = validate(loginSchema, req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  const valid = await checkPassword(data.password, user?.passwordHash ?? DUMMY_HASH);
  // Same answer for unknown email and wrong password, so accounts cannot be guessed
  if (!user || !valid) throw new HttpError(401, 'INVALID_CREDENTIALS');

  setSessionCookie(res, user.id);
  res.json({ user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

const recoverSchema = z.object({
  email: emailSchema,
  recoveryCode: z.string().max(40).transform(normalizeRecoveryCode).pipe(z.string().length(16)),
  password: passwordSchema,
});

// Forgotten password: email + recovery code + new password
router.post('/recover', authLimiter, async (req, res) => {
  const data = validate(recoverSchema, req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  const valid = await checkPassword(data.recoveryCode, user?.recoveryCodeHash ?? DUMMY_HASH);
  if (!user?.recoveryCodeHash || !valid) throw new HttpError(401, 'INVALID_RECOVERY');

  // A used code is replaced, and every other session is logged out
  const recovery = await newRecoveryCode();
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(data.password),
      recoveryCodeHash: recovery.hash,
      passwordChangedAt: new Date(),
    },
  });
  setSessionCookie(res, updated.id);
  res.json({ user: publicUser(updated), recoveryCode: recovery.code });
});

// Logged-in user gets a new code; the password is asked again in case the session was stolen
router.post('/recovery-code', authLimiter, requireAuth, async (req, res) => {
  const { password } = validate(z.object({ password: z.string().min(1).max(128) }), req.body);
  if (!(await checkPassword(password, req.user.passwordHash))) throw new HttpError(401, 'INVALID_PASSWORD');

  const recovery = await newRecoveryCode();
  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { recoveryCodeHash: recovery.hash },
  });
  res.json({ user: publicUser(updated), recoveryCode: recovery.code });
});

export default router;
