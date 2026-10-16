import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api } from '../api.js';
import { categoryLabels, typeLabels, useCategories } from '../categories.js';
import { formatCents, formatDay, formatMonth, thisMonth } from '../format.js';
import { errorMessage } from '../messages.js';

export default function Transactions() {
  const categories = useCategories();
  // Filters live in the URL, so a filtered list can be bookmarked or refreshed
  const [params, setParams] = useSearchParams();
  const filters = {
    month: params.get('month') || thisMonth(),
    category: params.get('category') || '',
    type: params.get('type') || '',
    q: params.get('q') || '',
  };
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();

  useEffect(() => {
    api(`/transactions?${query}`)
      .then(setData)
      .catch((err) => setError(errorMessage(err)));
  }, [query, reload]);

  const setFilter = (name, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true });
  };

  const remove = async (transaction) => {
    const label = `${categoryLabels[transaction.categoryId]} de ${formatCents(transaction.amountCents)}`;
    if (!window.confirm(`Supprimer « ${label} » ?`)) return;
    try {
      await api(`/transactions/${transaction.id}`, { method: 'DELETE' });
      setReload(reload + 1);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // Groups the list by day, keeping the newest first
  const days = [];
  for (const t of data?.transactions || []) {
    const last = days.at(-1);
    if (last?.date === t.date) last.items.push(t);
    else days.push({ date: t.date, items: [t] });
  }

  return (
    <main>
      <h1>Transactions</h1>
      <p>
        <Link to="/transactions/new">Ajouter une dépense</Link> ·{' '}
        <Link to="/transactions/new?type=INCOME">Ajouter un revenu</Link>
      </p>

      <form role="search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="month">Mois</label>{' '}
        <input id="month" type="month" value={filters.month} onChange={(e) => setFilter('month', e.target.value)} />{' '}
        <label htmlFor="type">Type</label>{' '}
        <select id="type" value={filters.type} onChange={(e) => setFilter('type', e.target.value)}>
          <option value="">Tous</option>
          <option value="EXPENSE">Dépenses</option>
          <option value="INCOME">Revenus</option>
        </select>{' '}
        <label htmlFor="category">Catégorie</label>{' '}
        <select id="category" value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
          <option value="">Toutes</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {categoryLabels[c.id]}
            </option>
          ))}
        </select>{' '}
        <label htmlFor="q">Recherche dans la note</label>{' '}
        <input id="q" type="search" value={filters.q} onChange={(e) => setFilter('q', e.target.value)} />
      </form>

      {error && <p role="alert">{error}</p>}
      {!data && !error && <p>Chargement…</p>}

      {data && (
        <>
          <h2>{formatMonth(data.month)}</h2>
          <p>
            Dépenses : <strong>{formatCents(data.totals.expenseCents)}</strong> · Revenus :{' '}
            <strong>{formatCents(data.totals.incomeCents)}</strong>
          </p>
          {days.length === 0 && <p>Aucune transaction pour ces critères.</p>}
          {days.map((day) => (
            <section key={day.date}>
              <h3>{formatDay(day.date)}</h3>
              <ul>
                {day.items.map((t) => (
                  <li key={t.id}>
                    {t.type === 'EXPENSE' ? '−' : '+'}
                    {formatCents(t.amountCents)} · {categoryLabels[t.categoryId]} ({typeLabels[t.type]})
                    {t.note && <> · {t.note}</>} · <Link to={`/transactions/${t.id}/edit`}>Modifier</Link>{' '}
                    <button type="button" onClick={() => remove(t)}>
                      Supprimer
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </main>
  );
}
