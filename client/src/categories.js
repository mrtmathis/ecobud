import { useEffect, useState } from 'react';
import { api } from './api.js';

// Category list, loaded once and shared between pages; labels come from the translations
let cache = null;
export function useCategories() {
  const [categories, setCategories] = useState(cache || []);
  useEffect(() => {
    if (cache) return;
    api('/categories').then((data) => {
      cache = data.categories;
      setCategories(cache);
    });
  }, []);
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
