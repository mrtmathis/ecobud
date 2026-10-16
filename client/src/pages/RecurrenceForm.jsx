import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../api.js';
import { categoryLabels, useCategories } from '../categories.js';
import { centsToInput, parseAmount, today } from '../format.js';
import { errorMessage } from '../messages.js';

const fieldMessages = {
  label: 'Donne un nom, par exemple « Netflix » ou « Loyer ».',
  amountCents: 'Montant invalide.',
  categoryId: 'Choisis une catégorie.',
  nextDate: 'La date doit être aujourd’hui ou dans les 12 prochains mois.',
};

// Used both to add a recurrence and to edit one (when the URL has an id)
export default function RecurrenceForm() {
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
    if (!amountCents) return setError(fieldMessages.amountCents);
    if (!form.categoryId) return setError(fieldMessages.categoryId);
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
      setError(fieldMessages[err.fields?.[0]] || errorMessage(err));
      setSending(false);
    }
  };

  if (loading) return <p>Chargement…</p>;

  return (
    <main>
      <h1>{id ? 'Modifier la récurrence' : 'Nouvelle récurrence'}</h1>
      <form onSubmit={submit}>
        <fieldset>
          <legend>Type</legend>
          <label>
            <input type="radio" name="type" checked={isExpense} onChange={() => changeType('EXPENSE')} /> Dépense
          </label>{' '}
          <label>
            <input type="radio" name="type" checked={!isExpense} onChange={() => changeType('INCOME')} /> Revenu
          </label>
        </fieldset>

        <p>
          <label htmlFor="label">Nom</label>
          <br />
          <input
            id="label"
            maxLength={60}
            required
            placeholder={isExpense ? 'Ex. : Netflix, Loyer' : 'Ex. : Salaire'}
            value={form.label}
            onChange={(e) => update('label', e.target.value)}
          />
        </p>

        <p>
          <label htmlFor="amount">Montant (€)</label>
          <br />
          <input id="amount" inputMode="decimal" placeholder="0,00" autoComplete="off" required value={form.amount} onChange={(e) => update('amount', e.target.value)} />
        </p>

        <fieldset>
          <legend>Catégorie</legend>
          {choices.map((c) => (
            <label key={c.id}>
              <input type="radio" name="category" checked={form.categoryId === c.id} onChange={() => changeCategory(c.id)} />{' '}
              {categoryLabels[c.id]}{' '}
            </label>
          ))}
        </fieldset>

        <p>
          <label htmlFor="frequency">Fréquence</label>
          <br />
          <select id="frequency" value={form.frequency} onChange={(e) => update('frequency', e.target.value)}>
            <option value="MONTHLY">Tous les mois</option>
            <option value="YEARLY">Tous les ans</option>
          </select>
        </p>

        {isExpense && (
          <p>
            <label>
              <input type="checkbox" checked={form.isTrial} onChange={(e) => update('isTrial', e.target.checked)} /> C’est une
              période d’essai gratuite
            </label>
          </p>
        )}

        <p>
          <label htmlFor="nextDate">
            {form.isTrial ? 'Fin de l’essai (date du premier prélèvement)' : 'Date du prochain prélèvement'}
          </label>
          <br />
          <input id="nextDate" type="date" min={today()} required value={form.nextDate} onChange={(e) => update('nextDate', e.target.value)} />
        </p>

        {isExpense && (
          <fieldset>
            <legend>Rappel avant le prélèvement</legend>
            <label>
              <input type="checkbox" checked={form.remindOn} onChange={(e) => update('remindOn', e.target.checked)} /> Me
              prévenir pour pouvoir résilier à temps
            </label>{' '}
            <label htmlFor="remindDaysBefore">Délai</label>{' '}
            <select
              id="remindDaysBefore"
              disabled={!form.remindOn}
              value={form.remindDaysBefore}
              onChange={(e) => update('remindDaysBefore', e.target.value)}
            >
              <option value={1}>La veille</option>
              <option value={3}>3 jours avant</option>
              <option value={7}>7 jours avant</option>
            </select>
          </fieldset>
        )}

        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={sending}>
          {sending ? 'Enregistrement…' : 'Enregistrer'}
        </button>{' '}
        <Link to="/recurrences">Annuler</Link>
      </form>
    </main>
  );
}
