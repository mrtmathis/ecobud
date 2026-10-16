import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { validate } from '../lib/validation.js';
import { publicUser } from '../lib/auth.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();
router.use(requireAuth);

// Account language, also used later for notifications
router.put('/language', async (req, res) => {
  const { language } = validate(z.object({ language: z.enum(['fr', 'en']) }), req.body);
  const user = await prisma.user.update({ where: { id: req.user.id }, data: { language } });
  res.json({ user: publicUser(user) });
});

export default router;
