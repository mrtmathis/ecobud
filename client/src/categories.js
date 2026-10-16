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
