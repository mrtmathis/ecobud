import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { categoryColor } from '../categories.js';
import { formatCents, formatMonth, thisMonth } from '../format.js';
import { errorMessage } from '../messages.js';
import Icon from '../components/Icon.jsx';
import RecapHero from '../components/RecapHero.jsx';

// Last finished month, "YYYY-MM"
function lastMonth() {
  const [y, m] = thisMonth().split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

export default function Recap() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const month = params.get('month') || lastMonth();

  return (
    <main className="recap">
      <div className="page-head">
        <h1>{t('recap.title')}</h1>
        <div className="field">
          <label htmlFor="month">{t('common.month')}</label>
          <input
            id="month"
            type="month"
            max={lastMonth()}
            value={month}
            onChange={(e) => e.target.value && setParams({ month: e.target.value })}
          />
        </div>
      </div>
      <MonthRecap key={month} month={month} />
    </main>
  );
}

function MonthRecap({ month }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [recap, setRecap] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/recap?month=${month}`)
      .then((data) => setRecap(data.recap))
      .catch((err) => setError(errorMessage(err)));
  }, [month]);

  const answer = async (status) => {
    try {
      await api(`/recap/${month}/answer`, { method: 'PUT', body: { status } });
      setRecap({ ...recap, answer: status });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (error) return <p role="alert">{error}</p>;
  if (!recap) return <p>{t('common.loading')}</p>;

  const saved = formatCents(recap.savedCents);
  const biggest = recap.topCategories[0]?.amountCents || 1;

  return (
    <>
      <RecapHero recap={recap} month={month} skin={user.skin} />
      {recap.overCents > 0 && (
        <p className="empty">
          {t('recap.overText', { spent: formatCents(recap.spentCents), budget: formatCents(recap.budgetCents) })}
        </p>
      )}

      {recap.savedCents > 0 && (
        <section className="aside-card" aria-labelledby="aside-title">
          <h2 id="aside-title">{t('recap.asideTitle')}</h2>
          {recap.answer === 'DONE' ? (
            <p className="today-done">
              <Icon name="check" /> {t('recap.done', { amount: saved, month: formatMonth(month) })}
            </p>
          ) : (
            <>
              <p>{t('recap.advice', { amount: saved })}</p>
              {recap.answer === 'REMIND_LATER' && <p role="status">{t('recap.remindLaterSet')}</p>}
              <div className="form-actions">
                <button type="button" className="primary" onClick={() => answer('DONE')}>
                  <Icon name="check" size={18} /> {t('recap.doneButton')}
                </button>
                {recap.answer !== 'REMIND_LATER' && (
                  <button type="button" onClick={() => answer('REMIND_LATER')}>
                    <Icon name="bell" size={18} /> {t('recap.remindLater')}
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      )}

      <section aria-labelledby="top-title">
        <h2 id="top-title">{t('recap.topTitle')}</h2>
        {recap.topCategories.length === 0 ? (
          <p className="empty">{t('recap.noExpenses')}</p>
        ) : (
          <ol className="ranking">
            {recap.topCategories.map((c, i) => (
              <li key={c.categoryId} style={{ '--dot': categoryColor(c.categoryId) }}>
                <span className="rank" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="ranking-main">
                  <span className="ranking-line">
                    <strong>{t(`categories.${c.categoryId}`)}</strong>
                    <span className="tnum">{formatCents(c.amountCents)}</span>
                  </span>
                  <span className="ranking-bar" aria-hidden="true">
                    <i style={{ width: `${Math.round((c.amountCents / biggest) * 100)}%` }} />
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
        <p className="today-income">{t('recap.income', { amount: formatCents(recap.incomeCents) })}</p>
      </section>

      <p>
        <Link to={`/transactions?month=${month}`}>{t('recap.seeTransactions', { month: formatMonth(month) })}</Link>
      </p>
    </>
  );
}
