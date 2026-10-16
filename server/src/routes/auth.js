import { createHash, randomBytes } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { emailSchema, passwordSchema, validate } from '../lib/validation.js';
import {
  DUMMY_HASH,
  checkPassword,
  clearSessionCookie,
  hashPassword,
  publicUser,
  setSessionCookie,
} from '../lib/auth.js';
import { sendMail } from '../lib/mailer.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { authLimiter } from '../middlewares/security.js';

const router = Router();
const RESET_MINUTES = 30;
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

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

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      language: data.language,
      passwordHash: await hashPassword(data.password),
    },
  });
  setSessionCookie(res, user.id);
  res.status(201).json({ user: publicUser(user) });
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

router.post('/forgot-password', authLimiter, async (req, res) => {
  const { email } = validate(z.object({ email: emailSchema }), req.body);
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = randomBytes(32).toString('hex');
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: {
        tokenHash: sha256(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + RESET_MINUTES * 60 * 1000),
      },
    });
    const link = `${process.env.APP_URL}/reset-password?token=${token}`;
    const fr = user.language === 'fr';
    // A failed send must not change the answer, or it would reveal that the account exists
    await sendMail({
      to: user.email,
      subject: fr ? 'Réinitialise ton mot de passe EcoBud' : 'Reset your EcoBud password',
      text: fr
        ? `Bonjour ${user.name},\n\nPour choisir un nouveau mot de passe, ouvre ce lien (valable ${RESET_MINUTES} minutes) :\n${link}\n\nSi tu n'as rien demandé, ignore cet e-mail.`
        : `Hi ${user.name},\n\nTo choose a new password, open this link (valid for ${RESET_MINUTES} minutes):\n${link}\n\nIf you did not ask for this, ignore this email.`,
    }).catch((err) => console.error('Password reset email failed:', err.message));
  }
  // Always the same answer, so nobody can check which emails have an account
  res.json({ ok: true });
});

const resetSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), password: passwordSchema });

router.post('/reset-password', authLimiter, async (req, res) => {
  const data = validate(resetSchema, req.body);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(data.token) } });
  if (!record || record.expiresAt < new Date()) throw new HttpError(400, 'INVALID_RESET_TOKEN');

  // New password, all reset links removed, and every existing session logged out
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(data.password), passwordChangedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);
  res.json({ ok: true });
});

export default router;
