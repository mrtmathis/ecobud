import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { formatCents, formatMonth, thisMonth } from '../format.js';
import { errorMessage } from '../messages.js';

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
    <main>
      <h1>{t('recap.title')}</h1>
      <p>
        <label htmlFor="month">{t('common.month')}</label>{' '}
        <input
          id="month"
          type="month"
          max={lastMonth()}
          value={month}
          onChange={(e) => e.target.value && setParams({ month: e.target.value })}
        />
      </p>
      <MonthRecap key={month} month={month} />
    </main>
  );
}

function MonthRecap({ month }) {
  const { t } = useTranslation();
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

  const spent = formatCents(recap.spentCents);
  const budget = recap.budgetCents === null ? '' : formatCents(recap.budgetCents);
  const saved = formatCents(recap.savedCents);

  return (
    <>
      <h2>{formatMonth(month)}</h2>

      {recap.budgetCents === null ? (
        <p>{t('recap.noBudget', { amount: spent })}</p>
      ) : recap.overCents > 0 ? (
        <section aria-labelledby="result-title">
          <h3 id="result-title">{t('recap.overTitle', { amount: formatCents(recap.overCents) })}</h3>
          <p>{t('recap.overText', { spent, budget })}</p>
        </section>
      ) : (
        <section aria-labelledby="result-title">
          <h3 id="result-title">{t('recap.savedTitle')}</h3>
          <p>
            <strong style={{ fontSize: '2em' }}>{saved}</strong>
          </p>
          <p>{t('recap.spentOfBudget', { spent, budget })}</p>
        </section>
      )}

      {recap.savedCents > 0 && (
        <section aria-labelledby="aside-title">
          <h3 id="aside-title">{t('recap.asideTitle')}</h3>
          {recap.answer === 'DONE' ? (
            <p role="status">{t('recap.done', { amount: saved, month: formatMonth(month) })}</p>
          ) : (
            <>
              <p>{t('recap.advice', { amount: saved })}</p>
              {recap.answer === 'REMIND_LATER' && <p role="status">{t('recap.remindLaterSet')}</p>}
              <button type="button" onClick={() => answer('DONE')}>
                {t('recap.doneButton')}
              </button>{' '}
              {recap.answer !== 'REMIND_LATER' && (
                <button type="button" onClick={() => answer('REMIND_LATER')}>
                  {t('recap.remindLater')}
                </button>
              )}
            </>
          )}
        </section>
      )}

      <section aria-labelledby="top-title">
        <h3 id="top-title">{t('recap.topTitle')}</h3>
        {recap.topCategories.length === 0 ? (
          <p>{t('recap.noExpenses')}</p>
        ) : (
          <ol>
            {recap.topCategories.map((c) => (
              <li key={c.categoryId}>
                {t('recap.categoryAmount', { category: t(`categories.${c.categoryId}`), amount: formatCents(c.amountCents) })}
              </li>
            ))}
          </ol>
        )}
      </section>

      <p>{t('recap.income', { amount: formatCents(recap.incomeCents) })}</p>
      <p>
        <Link to={`/transactions?month=${month}`}>{t('recap.seeTransactions', { month: formatMonth(month) })}</Link>
      </p>
    </>
  );
}
