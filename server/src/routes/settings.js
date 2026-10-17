import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { validate } from '../lib/validation.js';
import { publicUser } from '../lib/auth.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();
router.use(requireAuth);

const settingsOf = (user) => ({
  reminderOn: user.reminderOn,
  reminderTime: user.reminderTime,
  reminderDays: user.reminderDays,
  alertsOn: user.alertsOn,
  timezone: user.timezone,
});

router.get('/', (req, res) => {
  res.json({ settings: settingsOf(req.user) });
});

// Times every 15 minutes, because the notification job runs every 15 minutes
const reminderSchema = z.object({
  reminderOn: z.boolean(),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):(00|15|30|45)$/),
  reminderDays: z
    .array(z.number().int().min(1).max(7))
    .max(7)
    .refine((days) => new Set(days).size === days.length),
});

router.put('/reminder', async (req, res) => {
  const data = validate(reminderSchema, req.body);
  data.reminderDays.sort((a, b) => a - b);
  const user = await prisma.user.update({ where: { id: req.user.id }, data });
  res.json({ settings: settingsOf(user) });
});

router.put('/alerts', async (req, res) => {
  const data = validate(z.object({ alertsOn: z.boolean() }), req.body);
  const user = await prisma.user.update({ where: { id: req.user.id }, data });
  res.json({ settings: settingsOf(user) });
});

// Only time zones the server knows, such as "Europe/Paris"
const timezoneSchema = z
  .string()
  .max(64)
  .refine((zone) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone: zone });
      return true;
    } catch {
      return false;
    }
  });

// Sent by the browser so "today" and reminder times match where the user lives
router.put('/timezone', async (req, res) => {
  const { timezone } = validate(z.object({ timezone: timezoneSchema }), req.body);
  const user = await prisma.user.update({ where: { id: req.user.id }, data: { timezone } });
  res.json({ user: publicUser(user) });
});

// Theme and light or dark mode; saving it also ends the first-login choice
router.put('/theme', async (req, res) => {
  const data = validate(
    z.object({ skin: z.enum(['ticket', 'bocal', 'pop']), appearance: z.enum(['auto', 'light', 'dark']) }),
    req.body,
  );
  const user = await prisma.user.update({ where: { id: req.user.id }, data: { ...data, themeChosen: true } });
  res.json({ user: publicUser(user) });
});

// First-login guide finished or skipped (true), or asked again from My account (false)
router.put('/onboarding', async (req, res) => {
  const { done } = validate(z.object({ done: z.boolean() }), req.body);
  const user = await prisma.user.update({ where: { id: req.user.id }, data: { onboardingDone: done } });
  res.json({ user: publicUser(user) });
});

// Account language, also used for notifications
router.put('/language', async (req, res) => {
  const { language } = validate(z.object({ language: z.enum(['fr', 'en']) }), req.body);
  const user = await prisma.user.update({ where: { id: req.user.id }, data: { language } });
  res.json({ user: publicUser(user) });
});

export default router;
