import { useEffect, useState } from 'react';
import { api } from './api.js';

// French labels for the category ids sent by the API
export const categoryLabels = {
  groceries: 'Courses',
  rent: 'Loyer',
  transport: 'Transport',
  outings: 'Sorties',
  health: 'Santé',
  studies: 'Études',
  subscriptions: 'Abonnements',
  other: 'Autre',
  salary: 'Salaire',
  family: 'Aide de la famille',
  transfer: 'Virement reçu',
  other_income: 'Autre revenu',
};

export const typeLabels = { EXPENSE: 'Dépense', INCOME: 'Revenu' };

// Category list, loaded once and shared between pages
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
