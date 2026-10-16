import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { categoryColor, useCategories } from '../categories.js';
import { centsToInput, parseAmount, today } from '../format.js';
import { errorMessage } from '../messages.js';

// Translation key for each field the API can reject
const fieldMessages = {
  label: 'recurrenceForm.nameMissing',
  amountCents: 'common.invalidAmount',
  categoryId: 'common.chooseCategory',
  nextDate: 'recurrenceForm.nextDateInvalid',
};

// Used both to add a recurrence and to edit one (when the URL has an id)
export default function RecurrenceForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const categories = useCategories();
  const [form, setForm] = useState({
    label: '',
    type: 'EXPENSE',
    amount: '',
    categoryId: '',
    frequency: 'MONTHLY',
    nextDate: '',
    isTrial: false,
    remindOn: false,
    remindDaysBefore: 3,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(id));
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    api(`/recurrences/${id}`)
      .then(({ recurrence: r }) => setForm({ ...r, amount: centsToInput(r.amountCents) }))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const choices = categories.filter((c) => c.type === form.type);
  const isExpense = form.type === 'EXPENSE';

  const changeType = (type) => setForm((f) => ({ ...f, type, categoryId: '', isTrial: false, remindOn: false }));

  // Subscriptions get a reminder by default, the user can still untick it
  const changeCategory = (categoryId) => setForm((f) => ({ ...f, categoryId, remindOn: categoryId === 'subscriptions' }));

  const submit = async (event) => {
    event.preventDefault();
    const amountCents = parseAmount(form.amount);
    if (!amountCents) return setError(t(fieldMessages.amountCents));
    if (!form.categoryId) return setError(t(fieldMessages.categoryId));
    setSending(true);
    setError('');
    try {
      const body = {
        label: form.label,
        type: form.type,
        amountCents,
        categoryId: form.categoryId,
        frequency: form.frequency,
        nextDate: form.nextDate,
        isTrial: isExpense && form.isTrial,
        remindOn: isExpense && form.remindOn,
        remindDaysBefore: Number(form.remindDaysBefore),
      };
      await api(id ? `/recurrences/${id}` : '/recurrences', { method: id ? 'PUT' : 'POST', body });
      navigate('/recurrences');
    } catch (err) {
      const field = fieldMessages[err.fields?.[0]];
      setError(field ? t(field) : errorMessage(err));
      setSending(false);
    }
  };

  if (loading) return <p>{t('common.loading')}</p>;

  return (
    <main>
      <div className="page-head">
        <h1>{id ? t('recurrenceForm.editTitle') : t('recurrenceForm.newTitle')}</h1>
      </div>
      <form onSubmit={submit} className="form-grid">
        <fieldset className="segmented">
          <legend>{t('common.type')}</legend>
          <label>
            <input type="radio" name="type" checked={isExpense} onChange={() => changeType('EXPENSE')} />
            <span>{t('common.expense')}</span>
          </label>
          <label>
            <input type="radio" name="type" checked={!isExpense} onChange={() => changeType('INCOME')} />
            <span>{t('common.income')}</span>
          </label>
        </fieldset>

        <div className="form-row">
          <div className="field">
            <label htmlFor="label">{t('recurrenceForm.name')}</label>
            <input
              id="label"
              maxLength={60}
              required
              placeholder={isExpense ? t('recurrenceForm.namePlaceholderExpense') : t('recurrenceForm.namePlaceholderIncome')}
              value={form.label}
              onChange={(e) => update('label', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="amount">{t('common.amount')}</label>
            <div className="amount-field">
              <input
                id="amount"
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
          {choices.map((c) => (
            <label key={c.id} className="tile" style={{ '--dot': categoryColor(c.id) }}>
              <input type="radio" name="category" checked={form.categoryId === c.id} onChange={() => changeCategory(c.id)} />
              <i aria-hidden="true" />
              {t(`categories.${c.id}`)}
            </label>
          ))}
        </fieldset>

        <div className="form-row">
          <div className="field">
            <span className="field-label" id="frequency-label">
              {t('recurrenceForm.frequency')}
            </span>
            <fieldset className="segmented" aria-labelledby="frequency-label">
              <label>
                <input type="radio" name="frequency" checked={form.frequency === 'MONTHLY'} onChange={() => update('frequency', 'MONTHLY')} />
                <span>{t('frequency.MONTHLY')}</span>
              </label>
              <label>
                <input type="radio" name="frequency" checked={form.frequency === 'YEARLY'} onChange={() => update('frequency', 'YEARLY')} />
                <span>{t('frequency.YEARLY')}</span>
              </label>
            </fieldset>
          </div>
          <div className="field">
            <label htmlFor="nextDate">{form.isTrial ? t('recurrenceForm.trialEnd') : t('recurrenceForm.nextDate')}</label>
            <input id="nextDate" type="date" min={today()} required value={form.nextDate} onChange={(e) => update('nextDate', e.target.value)} />
          </div>
        </div>

        {isExpense && (
          <section className="option-card" aria-labelledby="reminder-title">
            <h2 id="reminder-title">{t('recurrenceForm.reminderTitle')}</h2>
            <label className="switch">
              <input type="checkbox" checked={form.isTrial} onChange={(e) => update('isTrial', e.target.checked)} />
              <span>{t('recurrenceForm.isTrial')}</span>
            </label>
            <label className="switch">
              <input type="checkbox" checked={form.remindOn} onChange={(e) => update('remindOn', e.target.checked)} />
              <span>{t('recurrenceForm.remindMe')}</span>
            </label>
            <fieldset className="segmented" disabled={!form.remindOn}>
              <legend>{t('recurrenceForm.delay')}</legend>
              {[1, 3, 7].map((days) => (
                <label key={days}>
                  <input
                    type="radio"
                    name="remindDaysBefore"
                    checked={Number(form.remindDaysBefore) === days}
                    onChange={() => update('remindDaysBefore', days)}
                  />
                  <span>{days === 1 ? t('recurrenceForm.dayBefore') : t('recurrenceForm.daysBefore', { count: days })}</span>
                </label>
              ))}
            </fieldset>
          </section>
        )}

        {error && <p role="alert">{error}</p>}
        <div className="form-actions">
          <button type="submit" className="primary" disabled={sending}>
            {sending ? t('common.saving') : t('common.save')}
          </button>
          <Link to="/recurrences">{t('common.cancel')}</Link>
        </div>
      </form>
    </main>
  );
}
