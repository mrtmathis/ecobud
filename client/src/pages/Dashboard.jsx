import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { formatCents, formatDay, formatMonth, inDays } from '../format.js';
import { errorMessage } from '../messages.js';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/dashboard')
      .then(setData)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  // "Nothing spent today" on or off, then the dashboard is refreshed
  const setNothingSpent = async (on) => {
    try {
      await api(`/days/${data.today.date}/empty`, { method: on ? 'POST' : 'DELETE' });
      setData({ ...data, today: { ...data.today, nothingSpent: on } });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p>{t('common.loading')}</p>;

  const hasBudget = data.budgetCents !== null;
  const day = formatDay(data.today.date);
  const month = formatMonth(data.month);

  return (
    <main>
      <h1>{t('dashboard.hello', { name: user.name, context: user.skin })}</h1>
      <p>
        {t('dashboard.dateLine', {
          day: day.charAt(0).toUpperCase() + day.slice(1),
          month,
          context: /^[aeiou]/i.test(month) ? 'vowel' : undefined,
        })}
      </p>

      {!user.hasRecoveryCode && (
        <p role="alert">
          {t('dashboard.noRecoveryCode')} <Link to="/account">{t('dashboard.createRecoveryCode')}</Link>
        </p>
      )}

      {data.recapMonth && (
        <p role="status">
          {t('dashboard.recapReady', { month: formatMonth(data.recapMonth) })}{' '}
          <Link to={`/recap?month=${data.recapMonth}`}>{t('dashboard.recapLink')}</Link>
        </p>
      )}

      <section aria-labelledby="today-title">
        <h2 id="today-title">{t('dashboard.todayTitle')}</h2>
        {data.today.expenseCount > 0 ? (
          <p>{t('dashboard.expensesToday', { count: data.today.expenseCount })}</p>
        ) : data.today.nothingSpent ? (
          <p>
            {t('dashboard.dayValidated')}{' '}
            <button type="button" onClick={() => setNothingSpent(false)}>
              {t('common.cancel')}
            </button>
          </p>
        ) : (
          <p>
            <Link to="/transactions/new">{t('common.addExpense')}</Link> {t('dashboard.or')}{' '}
            <button type="button" onClick={() => setNothingSpent(true)}>
              {t('dashboard.nothingSpent')}
            </button>
          </p>
        )}
      </section>

      <section aria-labelledby="remaining-title">
        <h2 id="remaining-title">{t('dashboard.remainingTitle')}</h2>
        {hasBudget ? (
          <>
            <p>
              <strong style={{ fontSize: '2em' }}>{formatCents(data.remainingCents)}</strong>
            </p>
            <p>
              <meter min={0} max={100} low={80} high={99} optimum={0} value={Math.min(data.percentUsed, 100)}>
                {t('dashboard.percent', { percent: data.percentUsed })}
              </meter>{' '}
              {t('dashboard.spentOfBudget', {
                spent: formatCents(data.spentCents),
                budget: formatCents(data.budgetCents),
                percent: data.percentUsed,
              })}
            </p>
            {data.alertLevel === 100 && <p role="alert">{t('dashboard.over', { amount: formatCents(-data.remainingCents) })}</p>}
            {data.alertLevel === 80 && (
              <p role="alert">
                {t('dashboard.warning', { percent: data.percentUsed, remaining: formatCents(data.remainingCents) })}
              </p>
            )}
          </>
        ) : (
          <p>
            {t('dashboard.noBudget')} <Link to="/budget">{t('dashboard.setBudget')}</Link>
          </p>
        )}
        <p>
          {t('dashboard.monthIncome', { amount: formatCents(data.incomeCents) })} ·{' '}
          <Link to="/budget">{t('dashboard.editBudget')}</Link>
        </p>
      </section>

      <p>
        <Link to="/transactions/new">{t('common.addExpense')}</Link> ·{' '}
        <Link to="/transactions/new?type=INCOME">{t('dashboard.addIncomeLong')}</Link>
      </p>

      <section aria-labelledby="upcoming-title">
        <h2 id="upcoming-title">{t('dashboard.upcomingTitle')}</h2>
        {data.upcoming.length === 0 ? (
          <p>
            {t('dashboard.noUpcoming')} <Link to="/recurrences/new">{t('dashboard.addRecurrence')}</Link>
          </p>
        ) : (
          <ul>
            {data.upcoming.map((r) => (
              <li key={r.id}>
                {r.label} · {formatCents(r.amountCents)} · {r.isTrial ? `${t('dashboard.trialEnds')} ` : ''}
                {inDays(r.daysUntil)}
              </li>
            ))}
          </ul>
        )}
        <p>
          <Link to="/recurrences">{t('dashboard.manageRecurrences')}</Link>
        </p>
      </section>

      <section aria-labelledby="split-title">
        <h2 id="split-title">{t('dashboard.splitTitle')}</h2>
        {data.byCategory.length === 0 ? (
          <p>{t('dashboard.noExpenses')}</p>
        ) : (
          <ul>
            {data.byCategory.map((c) => (
              <li key={c.categoryId}>
                {t('dashboard.categoryShare', {
                  category: t(`categories.${c.categoryId}`),
                  amount: formatCents(c.amountCents),
                  percent: Math.round((c.amountCents / data.spentCents) * 100),
                })}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="latest-title">
        <h2 id="latest-title">{t('dashboard.latestTitle')}</h2>
        {data.latest.length === 0 ? (
          <p>{t('dashboard.noTransactions')}</p>
        ) : (
          <ul>
            {data.latest.map((tr) => (
              <li key={tr.id}>
                {tr.type === 'EXPENSE' ? '−' : '+'}
                {formatCents(tr.amountCents)} · {t(`categories.${tr.categoryId}`)}
                {tr.note && <> · {tr.note}</>} · {formatDay(tr.date)}
              </li>
            ))}
          </ul>
        )}
        <p>
          <Link to="/transactions">{t('dashboard.seeAll')}</Link>
        </p>
      </section>
    </main>
  );
}
