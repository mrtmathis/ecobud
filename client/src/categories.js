import { useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './auth.jsx';

// Category list in the user's order of use, loaded once per account and shared between pages;
// it stays the same during a visit so the tiles never move under the finger
let cache = { userId: null, list: null };
export function useCategories() {
  const { user } = useAuth();
  const userId = user?.id;
  const [categories, setCategories] = useState(cache.userId === userId && cache.list ? cache.list : []);
  useEffect(() => {
    if (!userId || (cache.userId === userId && cache.list)) return;
    api('/categories')
      .then((data) => {
        cache = { userId, list: data.categories };
        setCategories(data.categories);
      })
      .catch(() => {});
  }, [userId]);
  return categories;
}

// Chart color of each category, taken from the current theme
const colors = {
  rent: 'var(--c1)',
  groceries: 'var(--c2)',
  outings: 'var(--c3)',
  transport: 'var(--c4)',
  health: 'var(--c5)',
  studies: 'var(--c6)',
  subscriptions: 'var(--c7)',
};
export const categoryColor = (id) => colors[id] || 'var(--muted)';
