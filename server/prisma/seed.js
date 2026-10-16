import 'dotenv/config';
import { prisma } from '../src/db.js';

// Categories defined by the site; labels live in the front end translations
const categories = [
  { id: 'groceries', type: 'EXPENSE', icon: 'shopping-cart', color: '#2F7D6D' },
  { id: 'rent', type: 'EXPENSE', icon: 'home', color: '#3B6EA5' },
  { id: 'transport', type: 'EXPENSE', icon: 'bus', color: '#8A5CB8' },
  { id: 'outings', type: 'EXPENSE', icon: 'party-popper', color: '#D9783B' },
  { id: 'health', type: 'EXPENSE', icon: 'heart-pulse', color: '#C0474B' },
  { id: 'studies', type: 'EXPENSE', icon: 'graduation-cap', color: '#4C8C4A' },
  { id: 'subscriptions', type: 'EXPENSE', icon: 'repeat', color: '#B0892F' },
  { id: 'other', type: 'EXPENSE', icon: 'circle-help', color: '#6B7280', requiresNote: true },
  { id: 'salary', type: 'INCOME', icon: 'briefcase', color: '#3BA55C' },
  { id: 'family', type: 'INCOME', icon: 'users', color: '#3BA55C' },
  { id: 'transfer', type: 'INCOME', icon: 'arrow-down-left', color: '#3BA55C' },
  { id: 'other_income', type: 'INCOME', icon: 'circle-help', color: '#6B7280', requiresNote: true },
];

for (const [index, category] of categories.entries()) {
  const data = { ...category, sortOrder: index };
  await prisma.category.upsert({ where: { id: category.id }, update: data, create: data });
}

// Removes categories taken out of the list, unless something still uses them
const removed = await prisma.category.deleteMany({
  where: {
    id: { notIn: categories.map((c) => c.id) },
    transactions: { none: {} },
    recurrences: { none: {} },
    budgets: { none: {} },
  },
});

console.log(`${categories.length} categories seeded, ${removed.count} removed`);
await prisma.$disconnect();
