import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { categoryColor, useCategories } from '../categories.js';
import { centsToInput, parseAmount, shiftDay, today } from '../format.js';
import { errorMessage } from '../messages.js';

// Translation key for each field the API can reject
const fieldMessages = {
  amountCents: 'common.invalidAmount',
  categoryId: 'common.chooseCategory',
  note: 'transactionForm.noteMissing',
  date: 'transactionForm.futureDate',
};

// Used both to add a transaction and to edit one (when the URL has an id)
export default function TransactionForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const categories = useCategories();
  // "Add an income" links open the form with ?type=INCOME
  const [params] = useSearchParams();
  const initialType = params.get('type') === 'INCOME' ? 'INCOME' : 'EXPENSE';
  const [form, setForm] = useState({ type: initialType, amount: '', categoryId: '', date: today(), note: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(id));
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    api(`/transactions/${id}`)
      .then(({ transaction: tr }) =>
        setForm({ type: tr.type, amount: centsToInput(tr.amountCents), categoryId: tr.categoryId, date: tr.date, note: tr.note || '' }),
      )
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const choices = categories.filter((c) => c.type === form.type);
  const selected = categories.find((c) => c.id === form.categoryId);
  const noteRequired = Boolean(selected?.requiresNote);
  const now = today();
  const quickDays = [
    { day: now, label: t('common.todayLabel') },
    { day: shiftDay(now, -1), label: t('common.yesterday') },
  ];

  const changeType = (type) => setForm((f) => ({ ...f, type, categoryId: '' }));

  const submit = async (event) => {
    event.preventDefault();
    const amountCents = parseAmount(form.amount);
    if (!amountCents) return setError(t(fieldMessages.amountCents));
    if (!form.categoryId) return setError(t(fieldMessages.categoryId));
    setSending(true);
    setError('');
    try {
      const body = { type: form.type, amountCents, categoryId: form.categoryId, date: form.date, note: form.note };
      await api(id ? `/transactions/${id}` : '/transactions', { method: id ? 'PUT' : 'POST', body });
      navigate(`/transactions?month=${form.date.slice(0, 7)}`);
    } catch (err) {
      const field = fieldMessages[err.fields?.[0]];
      setError(field ? t(field) : errorMessage(err));
      setSending(false);
    }
  };

  if (loading) return <p>{t('common.loading')}</p>;

  const title = id
    ? t('transactionForm.editTitle')
    : form.type === 'INCOME'
      ? t('transactionForm.newIncome')
      : t('transactionForm.newExpense');

  return (
    <main>
      <div className="page-head">
        <h1>{title}</h1>
      </div>
      <form onSubmit={submit} className="form-grid">
        <fieldset className="segmented">
          <legend>{t('common.type')}</legend>
          <label>
            <input type="radio" name="type" checked={form.type === 'EXPENSE'} onChange={() => changeType('EXPENSE')} />
            <span>{t('common.expense')}</span>
          </label>
          <label>
            <input type="radio" name="type" checked={form.type === 'INCOME'} onChange={() => changeType('INCOME')} />
            <span>{t('common.income')}</span>
          </label>
        </fieldset>

        <div className="field">
          <label htmlFor="amount">{t('common.amount')}</label>
          <div className="amount-field">
            <input
              id="amount"
              inputMode="decimal"
              placeholder={t('common.amountPlaceholder')}
              autoComplete="off"
              autoFocus={!id}
              required
              value={form.amount}
              onChange={(e) => update('amount', e.target.value)}
            />
            <span aria-hidden="true">€</span>
          </div>
        </div>

        <fieldset className="tiles">
          <legend>{t('common.category')}</legend>
          {choices.map((c) => (
            <label key={c.id} className="tile" style={{ '--dot': categoryColor(c.id) }}>
              <input
                type="radio"
                name="category"
                value={c.id}
                checked={form.categoryId === c.id}
                onChange={() => update('categoryId', c.id)}
              />
              <i aria-hidden="true" />
              {t(`categories.${c.id}`)}
            </label>
          ))}
        </fieldset>

        <div className="form-row">
          <div className="field">
            <label htmlFor="date">{t('transactionForm.date')}</label>
            <input id="date" type="date" max={now} required value={form.date} onChange={(e) => update('date', e.target.value)} />
            <div className="chips">
              {quickDays.map((q) => (
                <button key={q.day} type="button" className="chip" aria-pressed={form.date === q.day} onClick={() => update('date', q.day)}>
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="note">{noteRequired ? t('transactionForm.noteRequired') : t('transactionForm.noteOptional')}</label>
            <input
              id="note"
              maxLength={200}
              required={noteRequired}
              placeholder={noteRequired ? t('transactionForm.notePlaceholderRequired') : t('transactionForm.notePlaceholder')}
              value={form.note}
              onChange={(e) => update('note', e.target.value)}
            />
          </div>
        </div>

        {error && <p role="alert">{error}</p>}
        <div className="form-actions">
          <button type="submit" className="primary" disabled={sending}>
            {sending ? t('common.saving') : t('common.save')}
          </button>
          <Link to="/transactions">{t('common.cancel')}</Link>
        </div>
      </form>
    </main>
  );
}
