import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { categoryLabels } from '../categories.js';
import { formatCents, formatDay, formatMonth, inDays } from '../format.js';
import { errorMessage } from '../messages.js';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/dashboard')
      .then(setData)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  // "Nothing spent today" on or off, then the dashboard is refreshed
  const setNothingSpent = async (on) => {
    try {
      await api(`/days/${data.today.date}/empty`, { method: on ? 'POST' : 'DELETE' });
      setData({ ...data, today: { ...data.today, nothingSpent: on } });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p>Chargement…</p>;

  const hasBudget = data.budgetCents !== null;

  return (
    <main>
      <h1>Bonjour {user.name}</h1>
      <p>{formatMonth(data.month)}</p>

      {!user.hasRecoveryCode && (
        <p role="alert">
          Tu n’as pas encore de code de récupération. <Link to="/account">Le créer dans Mon compte</Link>
        </p>
      )}

      {data.recapMonth && (
        <p role="status">
          Ton récap de {formatMonth(data.recapMonth)} est prêt.{' '}
          <Link to={`/recap?month=${data.recapMonth}`}>Voir combien tu as économisé</Link>
        </p>
      )}

      <section aria-labelledby="today-title">
        <h2 id="today-title">Aujourd’hui</h2>
        {data.today.expenseCount > 0 ? (
          <p>
            {data.today.expenseCount} dépense{data.today.expenseCount > 1 ? 's' : ''} notée
            {data.today.expenseCount > 1 ? 's' : ''} aujourd’hui.
          </p>
        ) : data.today.nothingSpent ? (
          <p>
            Journée validée : rien dépensé.{' '}
            <button type="button" onClick={() => setNothingSpent(false)}>
              Annuler
            </button>
          </p>
        ) : (
          <p>
            <Link to="/transactions/new">Ajouter une dépense</Link> ou{' '}
            <button type="button" onClick={() => setNothingSpent(true)}>
              Rien dépensé aujourd’hui
            </button>
          </p>
        )}
      </section>

      <section aria-labelledby="remaining-title">
        <h2 id="remaining-title">Reste à dépenser ce mois</h2>
        {hasBudget ? (
          <>
            <p>
              <strong style={{ fontSize: '2em' }}>{formatCents(data.remainingCents)}</strong>
            </p>
            <p>
              <meter min={0} max={100} low={80} high={99} optimum={0} value={Math.min(data.percentUsed, 100)}>
                {data.percentUsed} %
              </meter>{' '}
              {formatCents(data.spentCents)} dépensés sur un budget de {formatCents(data.budgetCents)} ({data.percentUsed} %)
            </p>
            {data.alertLevel === 100 && (
              <p role="alert">
                Budget dépassé de {formatCents(-data.remainingCents)}. Essaie de limiter les dépenses jusqu’à la fin du
                mois.
              </p>
            )}
            {data.alertLevel === 80 && (
              <p role="alert">
                Attention : tu as utilisé {data.percentUsed} % de ton budget. Il te reste {formatCents(data.remainingCents)}.
              </p>
            )}
          </>
        ) : (
          <p>
            Tu n’as pas encore fixé de budget. <Link to="/budget">Fixer mon budget du mois</Link>
          </p>
        )}
        <p>
          Revenus du mois : {formatCents(data.incomeCents)} · <Link to="/budget">Modifier le budget</Link>
        </p>
      </section>

      <p>
        <Link to="/transactions/new">Ajouter une dépense</Link> ·{' '}
        <Link to="/transactions/new?type=INCOME">Ajouter un revenu (salaire, virement…)</Link>
      </p>

      <section aria-labelledby="upcoming-title">
        <h2 id="upcoming-title">Prochains prélèvements (30 jours)</h2>
        {data.upcoming.length === 0 ? (
          <p>
            Aucun prélèvement prévu. <Link to="/recurrences/new">Ajouter un abonnement ou le loyer</Link>
          </p>
        ) : (
          <ul>
            {data.upcoming.map((r) => (
              <li key={r.id}>
                {r.label} · {formatCents(r.amountCents)} · {r.isTrial ? 'fin de l’essai ' : ''}
                {inDays(r.daysUntil)}
              </li>
            ))}
          </ul>
        )}
        <p>
          <Link to="/recurrences">Gérer les récurrences</Link>
        </p>
      </section>

      <section aria-labelledby="split-title">
        <h2 id="split-title">Répartition des dépenses</h2>
        {data.byCategory.length === 0 ? (
          <p>Aucune dépense ce mois-ci.</p>
        ) : (
          <ul>
            {data.byCategory.map((c) => (
              <li key={c.categoryId}>
                {categoryLabels[c.categoryId]} : {formatCents(c.amountCents)} (
                {Math.round((c.amountCents / data.spentCents) * 100)} %)
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="latest-title">
        <h2 id="latest-title">Dernières transactions</h2>
        {data.latest.length === 0 ? (
          <p>Aucune transaction ce mois-ci.</p>
        ) : (
          <ul>
            {data.latest.map((t) => (
              <li key={t.id}>
                {t.type === 'EXPENSE' ? '−' : '+'}
                {formatCents(t.amountCents)} · {categoryLabels[t.categoryId]}
                {t.note && <> · {t.note}</>} · {formatDay(t.date)}
              </li>
            ))}
          </ul>
        )}
        <p>
          <Link to="/transactions">Tout voir</Link>
        </p>
      </section>
    </main>
  );
}
