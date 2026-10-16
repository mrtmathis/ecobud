import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { useCategories } from '../categories.js';
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
      <h1>{id ? t('recurrenceForm.editTitle') : t('recurrenceForm.newTitle')}</h1>
      <form onSubmit={submit}>
        <fieldset>
          <legend>{t('common.type')}</legend>
          <label>
            <input type="radio" name="type" checked={isExpense} onChange={() => changeType('EXPENSE')} /> {t('common.expense')}
          </label>{' '}
          <label>
            <input type="radio" name="type" checked={!isExpense} onChange={() => changeType('INCOME')} /> {t('common.income')}
          </label>
        </fieldset>

        <p>
          <label htmlFor="label">{t('recurrenceForm.name')}</label>
          <br />
          <input
            id="label"
            maxLength={60}
            required
            placeholder={isExpense ? t('recurrenceForm.namePlaceholderExpense') : t('recurrenceForm.namePlaceholderIncome')}
            value={form.label}
            onChange={(e) => update('label', e.target.value)}
          />
        </p>

        <p>
          <label htmlFor="amount">{t('common.amount')}</label>
          <br />
          <input
            id="amount"
            inputMode="decimal"
            placeholder={t('common.amountPlaceholder')}
            autoComplete="off"
            required
            value={form.amount}
            onChange={(e) => update('amount', e.target.value)}
          />
        </p>

        <fieldset>
          <legend>{t('common.category')}</legend>
          {choices.map((c) => (
            <label key={c.id}>
              <input type="radio" name="category" checked={form.categoryId === c.id} onChange={() => changeCategory(c.id)} />{' '}
              {t(`categories.${c.id}`)}{' '}
            </label>
          ))}
        </fieldset>

        <p>
          <label htmlFor="frequency">{t('recurrenceForm.frequency')}</label>
          <br />
          <select id="frequency" value={form.frequency} onChange={(e) => update('frequency', e.target.value)}>
            <option value="MONTHLY">{t('frequency.MONTHLY')}</option>
            <option value="YEARLY">{t('frequency.YEARLY')}</option>
          </select>
        </p>

        {isExpense && (
          <p>
            <label>
              <input type="checkbox" checked={form.isTrial} onChange={(e) => update('isTrial', e.target.checked)} />{' '}
              {t('recurrenceForm.isTrial')}
            </label>
          </p>
        )}

        <p>
          <label htmlFor="nextDate">{form.isTrial ? t('recurrenceForm.trialEnd') : t('recurrenceForm.nextDate')}</label>
          <br />
          <input id="nextDate" type="date" min={today()} required value={form.nextDate} onChange={(e) => update('nextDate', e.target.value)} />
        </p>

        {isExpense && (
          <fieldset>
            <legend>{t('recurrenceForm.reminderTitle')}</legend>
            <label>
              <input type="checkbox" checked={form.remindOn} onChange={(e) => update('remindOn', e.target.checked)} />{' '}
              {t('recurrenceForm.remindMe')}
            </label>{' '}
            <label htmlFor="remindDaysBefore">{t('recurrenceForm.delay')}</label>{' '}
            <select
              id="remindDaysBefore"
              disabled={!form.remindOn}
              value={form.remindDaysBefore}
              onChange={(e) => update('remindDaysBefore', e.target.value)}
            >
              <option value={1}>{t('recurrenceForm.dayBefore')}</option>
              <option value={3}>{t('recurrenceForm.daysBefore', { count: 3 })}</option>
              <option value={7}>{t('recurrenceForm.daysBefore', { count: 7 })}</option>
            </select>
          </fieldset>
        )}

        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={sending}>
          {sending ? t('common.saving') : t('common.save')}
        </button>{' '}
        <Link to="/recurrences">{t('common.cancel')}</Link>
      </form>
    </main>
  );
}
