import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

// Fixed list defined by the site; labels are translated by the front end from the id
router.get('/', requireAuth, async (req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
  res.json({ categories });
});

export default router;
