import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { useCategories } from '../categories.js';
import { formatCents, formatDay, formatMonth, thisMonth } from '../format.js';
import { errorMessage } from '../messages.js';

export default function Transactions() {
  const { t } = useTranslation();
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
    const question = t('transactions.confirmDelete', {
      category: t(`categories.${transaction.categoryId}`),
      amount: formatCents(transaction.amountCents),
    });
    if (!window.confirm(question)) return;
    try {
      await api(`/transactions/${transaction.id}`, { method: 'DELETE' });
      setReload(reload + 1);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // Groups the list by day, keeping the newest first
  const days = [];
  for (const tr of data?.transactions || []) {
    const last = days.at(-1);
    if (last?.date === tr.date) last.items.push(tr);
    else days.push({ date: tr.date, items: [tr] });
  }

  return (
    <main>
      <h1>{t('transactions.title')}</h1>
      <p>
        <Link to="/transactions/new">{t('common.addExpense')}</Link> ·{' '}
        <Link to="/transactions/new?type=INCOME">{t('common.addIncome')}</Link>
      </p>

      <form role="search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="month">{t('common.month')}</label>{' '}
        <input id="month" type="month" value={filters.month} onChange={(e) => setFilter('month', e.target.value)} />{' '}
        <label htmlFor="type">{t('common.type')}</label>{' '}
        <select id="type" value={filters.type} onChange={(e) => setFilter('type', e.target.value)}>
          <option value="">{t('transactions.all')}</option>
          <option value="EXPENSE">{t('transactions.expenses')}</option>
          <option value="INCOME">{t('transactions.incomes')}</option>
        </select>{' '}
        <label htmlFor="category">{t('common.category')}</label>{' '}
        <select id="category" value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
          <option value="">{t('transactions.allCategories')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {t(`categories.${c.id}`)}
            </option>
          ))}
        </select>{' '}
        <label htmlFor="q">{t('transactions.search')}</label>{' '}
        <input id="q" type="search" value={filters.q} onChange={(e) => setFilter('q', e.target.value)} />
      </form>

      {error && <p role="alert">{error}</p>}
      {!data && !error && <p>{t('common.loading')}</p>}

      {data && (
        <>
          <h2>{formatMonth(data.month)}</h2>
          <p>
            {t('transactions.totals', {
              expenses: formatCents(data.totals.expenseCents),
              incomes: formatCents(data.totals.incomeCents),
            })}
          </p>
          {days.length === 0 && <p>{t('transactions.empty')}</p>}
          {days.map((day) => (
            <section key={day.date}>
              <h3>{formatDay(day.date)}</h3>
              <ul>
                {day.items.map((tr) => (
                  <li key={tr.id}>
                    {tr.type === 'EXPENSE' ? '−' : '+'}
                    {formatCents(tr.amountCents)} · {t(`categories.${tr.categoryId}`)} (
                    {tr.type === 'EXPENSE' ? t('common.expense') : t('common.income')})
                    {tr.note && <> · {tr.note}</>} · <Link to={`/transactions/${tr.id}/edit`}>{t('common.edit')}</Link>{' '}
                    <button type="button" onClick={() => remove(tr)}>
                      {t('common.delete')}
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
