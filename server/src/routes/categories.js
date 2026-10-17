import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

// Use counted over the last 90 days, so the order follows current habits
const USAGE_DAYS = 90;
const ALWAYS_LAST = ['other', 'other_income'];

// Fixed list defined by the site; labels are translated by the front end from the id.
// The user's most used categories come first, "Other" always stays last
router.get('/', requireAuth, async (req, res) => {
  const since = new Date(Date.now() - USAGE_DAYS * 86_400_000);
  const [categories, usage] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId: req.user.id, date: { gte: since } },
      _count: { _all: true },
    }),
  ]);
  const uses = Object.fromEntries(usage.map((u) => [u.categoryId, u._count._all]));
  const rank = (c) => (ALWAYS_LAST.includes(c.id) ? -1 : uses[c.id] || 0);
  // Array sort is stable: equal counts keep the site's order
  categories.sort((a, b) => rank(b) - rank(a));
  res.json({ categories });
});

export default router;
