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
      <h1>{t('budget.title')}</h1>
      <p>
        <label htmlFor="month">{t('common.month')}</label>{' '}
        <input id="month" type="month" value={month} onChange={(e) => e.target.value && setParams({ month: e.target.value })} />
      </p>
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
      {budget === undefined && !error && <p>{t('common.loading')}</p>}
      {budget === null && <p>{t('budget.none', { month: formatMonth(month) })}</p>}
      {budget?.inherited && (
        <p>
          {t('budget.inherited', {
            month: formatMonth(month),
            from: formatMonth(budget.month),
            amount: formatCents(budget.amountCents),
          })}
        </p>
      )}
      {budget && !budget.inherited && (
        <p>{t('budget.current', { month: formatMonth(month), amount: formatCents(budget.amountCents) })}</p>
      )}

      <form onSubmit={submit}>
        <label htmlFor="amount">{t('budget.label')}</label>
        <br />
        <input
          id="amount"
          inputMode="decimal"
          placeholder={t('budget.placeholder')}
          autoComplete="off"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />{' '}
        <button type="submit">{t('common.save')}</button>
        <br />
        <small>{t('budget.carriesOver')}</small>
      </form>

      {saved && (
        <p role="status">{t('budget.saved', { month: formatMonth(month), amount: formatCents(saved) })}</p>
      )}
      {error && <p role="alert">{error}</p>}
    </>
  );
}
