import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { categoryColor, useCategories } from '../categories.js';
import { centsToInput, formatCents, parseAmount } from '../format.js';
import { errorMessage } from '../messages.js';
import Icon from './Icon.jsx';

// Spending limits per expense category for one month, added only for the categories the user wants to watch
export default function CategoryLimits({ month, budgetCents }) {
  const { t } = useTranslation();
  const categories = useCategories();
  const [limits, setLimits] = useState(null);
  // Category being added or edited, with the amount typed
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/budgets/categories?month=${month}`)
      .then((data) => setLimits(data.limits))
      .catch((err) => setError(errorMessage(err)));
  }, [month]);

  // Opened from "Manage my limits" on the dashboard: scroll down to this section once it is filled
  useEffect(() => {
    if (limits && window.location.hash === '#limits') document.getElementById('limits')?.scrollIntoView({ block: 'start' });
  }, [limits]);

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');
  const free = expenseCategories.filter((c) => !limits?.some((l) => l.categoryId === c.id));
  const name = (id) => t(`categories.${id}`);
  const totalCents = (limits ?? []).reduce((sum, l) => sum + l.amountCents, 0);

  const startAdd = () => {
    setStatus('');
    setError('');
    setForm({ categoryId: free[0]?.id ?? '', amount: '', editing: false });
  };
  const startEdit = (limit) => {
    setStatus('');
    setError('');
    setForm({ categoryId: limit.categoryId, amount: centsToInput(limit.amountCents), editing: true });
  };

  const save = async (event) => {
    event.preventDefault();
    const amountCents = parseAmount(form.amount);
    if (!amountCents) return setError(t('common.invalidAmount'));
    try {
      const data = await api('/budgets/categories', { method: 'PUT', body: { month, categoryId: form.categoryId, amountCents } });
      setLimits(data.limits);
      setStatus(t('budget.limitSaved', { category: name(form.categoryId), amount: formatCents(amountCents) }));
      setForm(null);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const remove = async (categoryId) => {
    try {
      const data = await api(`/budgets/categories/${categoryId}?month=${month}`, { method: 'DELETE' });
      setLimits(data.limits);
      setStatus(t('budget.limitRemoved', { category: name(categoryId) }));
      if (form?.categoryId === categoryId) setForm(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <section aria-labelledby="limits-title" id="limits" className="limits">
      <h2 id="limits-title">{t('budget.limitsTitle')}</h2>
      <p className="empty">{t('budget.limitsIntro')}</p>

      {limits === null && !error && <p>{t('common.loading')}</p>}
      {limits?.length > 0 && (
        <ul className="rows">
          {limits.map((l) => (
            <li key={l.categoryId} className="row with-actions">
              <span className="cat-dot" style={{ '--dot': categoryColor(l.categoryId) }} aria-hidden="true" />
              <span className="row-main">
                <strong>{name(l.categoryId)}</strong>
                <small>
                  {t('budget.limitSpent', { spent: formatCents(l.spentCents) })}
                  {l.inherited && ` · ${t('budget.limitInherited')}`}
                </small>
              </span>
              <span className="row-amount tnum">{formatCents(l.amountCents)}</span>
              <span className="row-actions">
                <button type="button" className="icon-button" onClick={() => startEdit(l)} aria-label={t('budget.editLimit', { category: name(l.categoryId) })}>
                  <Icon name="edit" size={18} />
                </button>
                <button type="button" className="icon-button danger" onClick={() => remove(l.categoryId)} aria-label={t('budget.removeLimit', { category: name(l.categoryId) })}>
                  <Icon name="trash" size={18} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {budgetCents > 0 && totalCents > budgetCents && (
        <p role="status" className="limits-warning">
          {t('budget.limitsOverBudget', { total: formatCents(totalCents), budget: formatCents(budgetCents) })}
        </p>
      )}

      {form ? (
        <form onSubmit={save} className="form-grid limit-form">
          <div className="field">
            <label htmlFor="limit-category">{t('budget.limitCategory')}</label>
            <select
              id="limit-category"
              value={form.categoryId}
              disabled={form.editing}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              {(form.editing ? expenseCategories.filter((c) => c.id === form.categoryId) : free).map((c) => (
                <option key={c.id} value={c.id}>
                  {name(c.id)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="limit-amount">{t('budget.limitAmount')}</label>
            <div className="amount-field">
              <input
                id="limit-amount"
                inputMode="decimal"
                placeholder={t('budget.limitPlaceholder')}
                autoComplete="off"
                required
                autoFocus
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
              <span aria-hidden="true">€</span>
            </div>
            <small>{t('budget.limitCarriesOver')}</small>
          </div>
          <div className="form-actions">
            <button type="submit" className="primary">
              {t('common.save')}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setForm(null)}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      ) : (
        free.length > 0 &&
        limits !== null && (
          <button type="button" onClick={startAdd}>
            <Icon name="plus" size={18} /> {t('budget.addLimit')}
          </button>
        )
      )}
      {status && <p role="status">{status}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
