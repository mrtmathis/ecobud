import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { categoryColor, useCategories } from '../categories.js';
import { formatCents, formatShortDay, parseAmount, today } from '../format.js';
import { errorMessage } from '../messages.js';

const empty = { label: '', amount: '', categoryId: '', nextDate: '' };

// Short monthly recurrence form used by the first-login guide, with the items already added
export default function QuickRecurrences({ type }) {
  const { t } = useTranslation();
  const categories = useCategories();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const isIncome = type === 'INCOME';

  useEffect(() => {
    api('/recurrences')
      .then((data) => setItems(data.recurrences.filter((r) => r.type === type)))
      .catch((err) => setError(errorMessage(err)));
  }, [type]);

  const update = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const submit = async (event) => {
    event.preventDefault();
    const amountCents = parseAmount(form.amount);
    if (!amountCents) return setError(t('common.invalidAmount'));
    if (!form.categoryId) return setError(t('common.chooseCategory'));
    setSending(true);
    setError('');
    try {
      const body = {
        label: form.label,
        type,
        amountCents,
        categoryId: form.categoryId,
        frequency: 'MONTHLY',
        nextDate: form.nextDate,
        // Subscriptions get a reminder before the debit, like in the full form
        remindOn: form.categoryId === 'subscriptions',
      };
      const data = await api('/recurrences', { method: 'POST', body });
      setItems((list) => [...list, data.recurrence]);
      setForm(empty);
    } catch (err) {
      setError(errorMessage(err));
    }
    setSending(false);
  };

  return (
    <section aria-labelledby={`quick-${type}`}>
      <h2 id={`quick-${type}`}>{t(isIncome ? 'onboarding.incomeListTitle' : 'onboarding.fixedListTitle')}</h2>
      {items.length === 0 ? (
        <p className="empty">{t('onboarding.nothingYet')}</p>
      ) : (
        <ul className="rows">
          {items.map((r) => (
            <li key={r.id} className="row">
              <span className="cat-dot" style={{ '--dot': categoryColor(r.categoryId) }} aria-hidden="true" />
              <span className="row-main">
                <strong>{r.label}</strong>
                <small>
                  {t(`categories.${r.categoryId}`)} · {t('onboarding.from', { date: formatShortDay(r.nextDate) })}
                </small>
              </span>
              <span className="row-amount tnum">{formatCents(r.amountCents)}</span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="form-grid">
        <div className="form-row">
          <div className="field">
            <label htmlFor={`label-${type}`}>{t('recurrenceForm.name')}</label>
            <input
              id={`label-${type}`}
              maxLength={60}
              required
              placeholder={isIncome ? t('onboarding.incomePlaceholder') : t('onboarding.fixedPlaceholder')}
              value={form.label}
              onChange={(e) => update('label', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor={`amount-${type}`}>{t('onboarding.monthlyAmount')}</label>
            <div className="amount-field">
              <input
                id={`amount-${type}`}
                inputMode="decimal"
                placeholder={t('common.amountPlaceholder')}
                autoComplete="off"
                required
                value={form.amount}
                onChange={(e) => update('amount', e.target.value)}
              />
              <span aria-hidden="true">€</span>
            </div>
          </div>
        </div>

        <fieldset className="tiles">
          <legend>{t('common.category')}</legend>
          {categories
            .filter((c) => c.type === type)
            .map((c) => (
              <label key={c.id} className="tile" style={{ '--dot': categoryColor(c.id) }}>
                <input
                  type="radio"
                  name={`category-${type}`}
                  value={c.id}
                  checked={form.categoryId === c.id}
                  onChange={() => update('categoryId', c.id)}
                />
                <i aria-hidden="true" />
                {t(`categories.${c.id}`)}
              </label>
            ))}
        </fieldset>

        <div className="field">
          <label htmlFor={`date-${type}`}>{isIncome ? t('recurrenceForm.nextIncomeDate') : t('recurrenceForm.nextDate')}</label>
          <input
            id={`date-${type}`}
            type="date"
            min={today()}
            required
            value={form.nextDate}
            onChange={(e) => update('nextDate', e.target.value)}
          />
        </div>

        {error && <p role="alert">{error}</p>}
        <div className="form-actions">
          <button type="submit" disabled={sending}>
            {t('onboarding.add')}
          </button>
        </div>
      </form>
    </section>
  );
}
