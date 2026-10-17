import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { categoryColor } from '../categories.js';
import { dayParts, formatCents, formatDay, formatMonth, formatShortDay, inDays, locale } from '../format.js';
import { errorMessage } from '../messages.js';
import BudgetHero from '../components/BudgetHero.jsx';
import DonutChart from '../components/DonutChart.jsx';
import Icon from '../components/Icon.jsx';

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

  const day = formatDay(data.today.date);
  const month = formatMonth(data.month);

  return (
    <main className="dash">
      <header className="dash-head">
        <h1>{t('dashboard.hello', { name: user.name, context: user.skin })}</h1>
        <p className="dash-date">
          {t('dashboard.dateLine', {
            day: day.charAt(0).toUpperCase() + day.slice(1),
            month,
            context: /^[aeiou]/i.test(month) ? 'vowel' : undefined,
          })}
        </p>
      </header>

      {(!user.hasRecoveryCode || data.recapMonth) && (
        <div className="dash-notices">
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
        </div>
      )}

      <div className="dash-hero">
        <BudgetHero data={data} skin={user.skin} />
        {data.alertLevel === 100 && (
          <p role="alert">{t('dashboard.over', { amount: formatCents(-data.remainingCents) })}</p>
        )}
        {data.alertLevel === 80 && (
          <p role="alert">{t('dashboard.warning', { percent: data.percentUsed, remaining: formatCents(data.remainingCents) })}</p>
        )}
        {data.previous && <Comparison spentCents={data.spentCents} previous={data.previous} />}
      </div>

      <section className="today-card" aria-labelledby="today-title">
        <h2 id="today-title">{t('dashboard.todayTitle')}</h2>
        {data.today.expenseCount > 0 ? (
          <p className="today-done">
            <Icon name="check" /> {t('dashboard.expensesToday', { count: data.today.expenseCount })}
          </p>
        ) : data.today.nothingSpent ? (
          <div className="today-done">
            <Icon name="check" /> <span>{t('dashboard.dayValidated')}</span>
            <button type="button" className="link-button" onClick={() => setNothingSpent(false)}>
              {t('common.cancel')}
            </button>
          </div>
        ) : (
          <div className="today-actions">
            <Link to="/transactions/new" className="btn">
              <Icon name="plus" size={18} /> {t('common.addExpense')}
            </Link>
            <button type="button" onClick={() => setNothingSpent(true)}>
              {t('dashboard.nothingSpent')}
            </button>
          </div>
        )}
        {data.streak > 0 && (
          <p className="streak">
            <Icon name="flame" size={18} /> {t('dashboard.streak', { count: data.streak })}
          </p>
        )}
        <p className="today-income">
          <Link to="/transactions/new?type=INCOME">{t('dashboard.addIncomeLong')}</Link>
          {' · '}
          {t('dashboard.monthIncome', { amount: formatCents(data.incomeCents) })}
        </p>
      </section>

      <section className="split-card" aria-labelledby="split-title">
        <h2 id="split-title">{t('dashboard.splitTitle')}</h2>
        {data.byCategory.length === 0 ? (
          <p className="empty">{t('dashboard.noExpenses')}</p>
        ) : (
          <div className="split">
            <DonutChart
              slices={data.byCategory.map((c) => ({ id: c.categoryId, value: c.amountCents, color: categoryColor(c.categoryId) }))}
              centerLabel={t('dashboard.spentLabel')}
              centerValue={formatCents(data.spentCents)}
            />
            <ul className="legend">
              {data.byCategory.map((c) => (
                <li key={c.categoryId}>
                  <i style={{ background: categoryColor(c.categoryId) }} aria-hidden="true" />
                  <span className="legend-name">{t(`categories.${c.categoryId}`)}</span>
                  <span className="legend-amount tnum">{formatCents(c.amountCents)}</span>
                  <span className="legend-share tnum">
                    {t('dashboard.percent', { percent: Math.round((c.amountCents / data.spentCents) * 100) })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="upcoming-card" aria-labelledby="upcoming-title">
        <div className="card-head">
          <h2 id="upcoming-title">{t('dashboard.upcomingTitle')}</h2>
          <Link to="/recurrences">{t('dashboard.manageRecurrences')}</Link>
        </div>
        {data.upcoming.length === 0 ? (
          <p className="empty">
            {t('dashboard.noUpcoming')} <Link to="/recurrences/new">{t('dashboard.addRecurrence')}</Link>
          </p>
        ) : (
          <ul className="rows">
            {data.upcoming.map((r) => {
              const date = dayParts(r.nextDate);
              return (
                <li key={r.id} className="row">
                  <span className="date-chip" aria-hidden="true">
                    <b>{date.day}</b>
                    <small>{date.month}</small>
                  </span>
                  <span className="row-main">
                    <strong>{r.label}</strong>
                    <small>
                      {r.isTrial && <span className="tag">{t('dashboard.trialEnds')}</span>} {inDays(r.daysUntil)}
                    </small>
                  </span>
                  <span className="row-amount tnum">{formatCents(r.amountCents)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="latest-card" aria-labelledby="latest-title">
        <div className="card-head">
          <h2 id="latest-title">{t('dashboard.latestTitle')}</h2>
          <Link to="/transactions">{t('dashboard.seeAll')}</Link>
        </div>
        {data.latest.length === 0 ? (
          <p className="empty">{t('dashboard.noTransactions')}</p>
        ) : (
          <ul className="rows">
            {data.latest.map((tr) => (
              <li key={tr.id} className="row">
                <span className="cat-dot" style={{ '--dot': categoryColor(tr.categoryId) }} aria-hidden="true" />
                <span className="row-main">
                  <strong>{tr.note || t(`categories.${tr.categoryId}`)}</strong>
                  <small>
                    {t(`categories.${tr.categoryId}`)} · {formatShortDay(tr.date)}
                  </small>
                </span>
                <span className={`row-amount tnum ${tr.type === 'EXPENSE' ? 'is-expense' : 'is-income'}`}>
                  {tr.type === 'EXPENSE' ? '−' : '+'}
                  {formatCents(tr.amountCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

// Spent so far this month against the same day of last month
function Comparison({ spentCents, previous }) {
  const { t } = useTranslation();
  const diff = spentCents - previous.spentCents;
  const month = new Date(`${previous.month}-15T12:00:00`).toLocaleDateString(locale(), { month: 'long' });
  const key = diff < 0 ? 'less' : diff > 0 ? 'more' : 'same';
  return (
    <p className={`comparison is-${key}`}>
      <Icon name={diff > 0 ? 'trendUp' : 'trendDown'} size={18} />
      {t(`dashboard.compare_${key}`, { amount: formatCents(Math.abs(diff)), month })}
    </p>
  );
}
