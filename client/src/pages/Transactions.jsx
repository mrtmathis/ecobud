import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { categoryColor, useCategories } from '../categories.js';
import { formatCents, formatDay, formatMonth, thisMonth } from '../format.js';
import { errorMessage } from '../messages.js';
import Icon from '../components/Icon.jsx';

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
      <div className="page-head">
        <h1>{t('transactions.title')}</h1>
        <div className="page-actions">
          <Link to="/transactions/new" className="btn">
            <Icon name="plus" size={18} /> {t('common.addExpense')}
          </Link>
          <Link to="/transactions/new?type=INCOME" className="btn btn-ghost">
            <Icon name="income" size={18} /> {t('common.addIncome')}
          </Link>
        </div>
      </div>

      <form role="search" className="card filters" onSubmit={(e) => e.preventDefault()}>
        <div className="field">
          <label htmlFor="month">{t('common.month')}</label>
          <input id="month" type="month" value={filters.month} onChange={(e) => setFilter('month', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="type">{t('common.type')}</label>
          <select id="type" value={filters.type} onChange={(e) => setFilter('type', e.target.value)}>
            <option value="">{t('transactions.all')}</option>
            <option value="EXPENSE">{t('transactions.expenses')}</option>
            <option value="INCOME">{t('transactions.incomes')}</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="category">{t('common.category')}</label>
          <select id="category" value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
            <option value="">{t('transactions.allCategories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {t(`categories.${c.id}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="q">{t('transactions.search')}</label>
          <input id="q" type="search" value={filters.q} onChange={(e) => setFilter('q', e.target.value)} />
        </div>
      </form>

      {error && <p role="alert">{error}</p>}
      {!data && !error && <p>{t('common.loading')}</p>}

      {data && (
        <>
          <div className="stats">
            <div className="stat">
              <span>{t('transactions.expenses')}</span>
              <strong className="tnum">{formatCents(data.totals.expenseCents)}</strong>
            </div>
            <div className="stat">
              <span>{t('transactions.incomes')}</span>
              <strong className="tnum is-income">{formatCents(data.totals.incomeCents)}</strong>
            </div>
          </div>

          {days.length === 0 ? (
            <section>
              <h2>{formatMonth(data.month)}</h2>
              <p className="empty">{t('transactions.empty')}</p>
            </section>
          ) : (
            days.map((day) => (
              <section key={day.date} className="day-group" aria-labelledby={`day-${day.date}`}>
                <h2 id={`day-${day.date}`}>{formatDay(day.date)}</h2>
                <ul className="rows">
                  {day.items.map((tr) => (
                    <li key={tr.id} className="row with-actions">
                      <span className="cat-dot" style={{ '--dot': categoryColor(tr.categoryId) }} aria-hidden="true" />
                      <span className="row-main">
                        <strong>{tr.note || t(`categories.${tr.categoryId}`)}</strong>
                        <small>
                          {t(`categories.${tr.categoryId}`)}
                        </small>
                      </span>
                      <span className={`row-amount tnum ${tr.type === 'EXPENSE' ? 'is-expense' : 'is-income'}`}>
                        {tr.type === 'EXPENSE' ? '−' : '+'}
                        {formatCents(tr.amountCents)}
                      </span>
                      <span className="row-actions">
                        <Link to={`/transactions/${tr.id}/edit`} className="icon-button" aria-label={t('common.edit')}>
                          <Icon name="edit" size={18} />
                        </Link>
                        <button type="button" className="icon-button danger" aria-label={t('common.delete')} onClick={() => remove(tr)}>
                          <Icon name="trash" size={18} />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </>
      )}
    </main>
  );
}
