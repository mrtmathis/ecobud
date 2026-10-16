import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { api } from '../api.js';
import { categoryLabels, useCategories } from '../categories.js';
import { centsToInput, parseAmount, today } from '../format.js';
import { errorMessage } from '../messages.js';

const fieldMessages = {
  amountCents: 'Montant invalide.',
  categoryId: 'Choisis une catégorie.',
  note: 'Pour « Autre », précise la dépense dans la note.',
  date: 'La date ne peut pas être dans le futur.',
};

// Used both to add a transaction and to edit one (when the URL has an id)
export default function TransactionForm() {
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
      .then(({ transaction: t }) =>
        setForm({ type: t.type, amount: centsToInput(t.amountCents), categoryId: t.categoryId, date: t.date, note: t.note || '' }),
      )
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  // Follow the menu when switching between "add an expense" and "add an income"
  useEffect(() => {
    if (!id) setForm((f) => (f.type === initialType ? f : { ...f, type: initialType, categoryId: '' }));
  }, [id, initialType]);

  const update = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const choices = categories.filter((c) => c.type === form.type);
  const selected = categories.find((c) => c.id === form.categoryId);
  const noteRequired = Boolean(selected?.requiresNote);

  const changeType = (type) => setForm((f) => ({ ...f, type, categoryId: '' }));

  const submit = async (event) => {
    event.preventDefault();
    const amountCents = parseAmount(form.amount);
    if (!amountCents) return setError(fieldMessages.amountCents);
    if (!form.categoryId) return setError(fieldMessages.categoryId);
    setSending(true);
    setError('');
    try {
      const body = { type: form.type, amountCents, categoryId: form.categoryId, date: form.date, note: form.note };
      await api(id ? `/transactions/${id}` : '/transactions', { method: id ? 'PUT' : 'POST', body });
      navigate(`/transactions?month=${form.date.slice(0, 7)}`);
    } catch (err) {
      setError(fieldMessages[err.fields?.[0]] || errorMessage(err));
      setSending(false);
    }
  };

  if (loading) return <p>Chargement…</p>;

  return (
    <main>
      <h1>{id ? 'Modifier la transaction' : form.type === 'INCOME' ? 'Nouveau revenu' : 'Nouvelle dépense'}</h1>
      <form onSubmit={submit}>
        <fieldset>
          <legend>Type</legend>
          <label>
            <input type="radio" name="type" checked={form.type === 'EXPENSE'} onChange={() => changeType('EXPENSE')} /> Dépense
          </label>{' '}
          <label>
            <input type="radio" name="type" checked={form.type === 'INCOME'} onChange={() => changeType('INCOME')} /> Revenu
          </label>
        </fieldset>

        <p>
          <label htmlFor="amount">Montant (€)</label>
          <br />
          <input
            id="amount"
            inputMode="decimal"
            placeholder="0,00"
            autoComplete="off"
            required
            value={form.amount}
            onChange={(e) => update('amount', e.target.value)}
          />
        </p>

        <fieldset>
          <legend>Catégorie</legend>
          {choices.map((c) => (
            <label key={c.id}>
              <input
                type="radio"
                name="category"
                value={c.id}
                checked={form.categoryId === c.id}
                onChange={() => update('categoryId', c.id)}
              />{' '}
              {categoryLabels[c.id]}{' '}
            </label>
          ))}
        </fieldset>

        <p>
          <label htmlFor="date">Date</label>
          <br />
          <input id="date" type="date" max={today()} required value={form.date} onChange={(e) => update('date', e.target.value)} />
        </p>

        <p>
          <label htmlFor="note">{noteRequired ? 'Détail de la dépense (obligatoire)' : 'Note (facultatif)'}</label>
          <br />
          <input
            id="note"
            maxLength={200}
            required={noteRequired}
            placeholder={noteRequired ? 'Ex. : coiffeur, cadeau' : 'Ex. : courses de la semaine'}
            value={form.note}
            onChange={(e) => update('note', e.target.value)}
          />
        </p>

        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={sending}>
          {sending ? 'Enregistrement…' : 'Enregistrer'}
        </button>{' '}
        <Link to="/transactions">Annuler</Link>
      </form>
    </main>
  );
}
