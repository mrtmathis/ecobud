import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { centsToInput, formatCents, formatMonth, parseAmount, thisMonth } from '../format.js';
import { errorMessage } from '../messages.js';

export default function Budget() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const month = params.get('month') || thisMonth();

  return (
    <main>
      <div className="page-head">
        <h1>{t('budget.title')}</h1>
        <div className="field">
          <label htmlFor="month">{t('common.month')}</label>
          <input id="month" type="month" value={month} onChange={(e) => e.target.value && setParams({ month: e.target.value })} />
        </div>
      </div>
      {/* The key gives each month a fresh form */}
      <MonthBudget key={month} month={month} />
      <p>
        <Link to="/dashboard">{t('common.backToDashboard')}</Link>
      </p>
    </main>
  );
}

function MonthBudget({ month }) {
  const { t } = useTranslation();
  const [budget, setBudget] = useState(undefined);
  const [amount, setAmount] = useState('');
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/budgets?month=${month}`)
      .then((data) => {
        setBudget(data.budget);
        setAmount(data.budget ? centsToInput(data.budget.amountCents) : '');
      })
      .catch((err) => setError(errorMessage(err)));
  }, [month]);

  const submit = async (event) => {
    event.preventDefault();
    const amountCents = parseAmount(amount);
    if (!amountCents) return setError(t('common.invalidAmount'));
    setError('');
    try {
      const data = await api('/budgets', { method: 'PUT', body: { month, amountCents } });
      setBudget(data.budget);
      setSaved(amountCents);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <section aria-labelledby="current-title">
        <h2 id="current-title">{formatMonth(month)}</h2>
        {budget === undefined && !error && <p>{t('common.loading')}</p>}
        {budget === null && <p className="empty">{t('budget.none', { month: formatMonth(month) })}</p>}
        {budget && (
          <>
            <p className="big-number tnum">{formatCents(budget.amountCents)}</p>
            {budget.inherited && (
              <p className="empty">
                {t('budget.inheritedShort', { from: formatMonth(budget.month) })}
              </p>
            )}
          </>
        )}
      </section>

      <form onSubmit={submit} className="form-grid">
        <div className="field">
          <label htmlFor="amount">{t('budget.label')}</label>
          <div className="amount-field">
            <input
              id="amount"
              inputMode="decimal"
              placeholder={t('budget.placeholder')}
              autoComplete="off"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <span aria-hidden="true">€</span>
          </div>
          <small>{t('budget.carriesOver')}</small>
        </div>
        <div className="form-actions">
          <button type="submit" className="primary">
            {t('common.save')}
          </button>
        </div>
        {saved && <p role="status">{t('budget.saved', { month: formatMonth(month), amount: formatCents(saved) })}</p>}
        {error && <p role="alert">{error}</p>}
      </form>
    </>
  );
}
