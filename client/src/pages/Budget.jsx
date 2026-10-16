import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api } from '../api.js';
import { centsToInput, formatCents, formatMonth, parseAmount, thisMonth } from '../format.js';
import { errorMessage } from '../messages.js';

export default function Budget() {
  const [params, setParams] = useSearchParams();
  const month = params.get('month') || thisMonth();

  return (
    <main>
      <h1>Budget</h1>
      <p>
        <label htmlFor="month">Mois</label>{' '}
        <input id="month" type="month" value={month} onChange={(e) => e.target.value && setParams({ month: e.target.value })} />
      </p>
      {/* The key gives each month a fresh form */}
      <MonthBudget key={month} month={month} />
      <p>
        <Link to="/dashboard">Retour au tableau de bord</Link>
      </p>
    </main>
  );
}

function MonthBudget({ month }) {
  const [budget, setBudget] = useState(undefined);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
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
    if (!amountCents) return setError('Montant invalide.');
    setError('');
    try {
      const data = await api('/budgets', { method: 'PUT', body: { month, amountCents } });
      setBudget(data.budget);
      setMessage(`Budget de ${formatMonth(month)} enregistré : ${formatCents(amountCents)}.`);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      {budget === undefined && !error && <p>Chargement…</p>}
      {budget === null && <p>Aucun budget pour {formatMonth(month)}.</p>}
      {budget?.inherited && (
        <p>
          Pas de budget propre à {formatMonth(month)} : celui de {formatMonth(budget.month)} s’applique (
          {formatCents(budget.amountCents)}).
        </p>
      )}
      {budget && !budget.inherited && (
        <p>
          Budget de {formatMonth(month)} : {formatCents(budget.amountCents)}.
        </p>
      )}

      <form onSubmit={submit}>
        <label htmlFor="amount">Budget global du mois (€)</label>
        <br />
        <input
          id="amount"
          inputMode="decimal"
          placeholder="Ex. : 800"
          autoComplete="off"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />{' '}
        <button type="submit">Enregistrer</button>
        <br />
        <small>Ce montant s’applique aussi aux mois suivants, tant que tu ne le changes pas.</small>
      </form>

      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </>
  );
}
