import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api } from '../api.js';
import { categoryLabels } from '../categories.js';
import { formatCents, formatMonth, thisMonth } from '../format.js';
import { errorMessage } from '../messages.js';

// Last finished month, "YYYY-MM"
function lastMonth() {
  const [y, m] = thisMonth().split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

export default function Recap() {
  const [params, setParams] = useSearchParams();
  const month = params.get('month') || lastMonth();

  return (
    <main>
      <h1>Récap du mois</h1>
      <p>
        <label htmlFor="month">Mois</label>{' '}
        <input
          id="month"
          type="month"
          max={lastMonth()}
          value={month}
          onChange={(e) => e.target.value && setParams({ month: e.target.value })}
        />
      </p>
      <MonthRecap key={month} month={month} />
    </main>
  );
}

function MonthRecap({ month }) {
  const [recap, setRecap] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/recap?month=${month}`)
      .then((data) => setRecap(data.recap))
      .catch((err) => setError(errorMessage(err)));
  }, [month]);

  const answer = async (status) => {
    try {
      await api(`/recap/${month}/answer`, { method: 'PUT', body: { status } });
      setRecap({ ...recap, answer: status });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (error) return <p role="alert">{error}</p>;
  if (!recap) return <p>Chargement…</p>;

  return (
    <>
      <h2>{formatMonth(month)}</h2>

      {recap.budgetCents === null ? (
        <p>
          Pas de budget pour ce mois : impossible de calculer ce que tu as économisé. Tu as dépensé{' '}
          {formatCents(recap.spentCents)}.
        </p>
      ) : recap.overCents > 0 ? (
        <section aria-labelledby="result-title">
          <h3 id="result-title">Budget dépassé de {formatCents(recap.overCents)}</h3>
          <p>
            {formatCents(recap.spentCents)} dépensés pour un budget de {formatCents(recap.budgetCents)}. Regarde ce qui a le
            plus pesé ci-dessous pour ajuster le mois prochain.
          </p>
        </section>
      ) : (
        <section aria-labelledby="result-title">
          <h3 id="result-title">Montant économisé</h3>
          <p>
            <strong style={{ fontSize: '2em' }}>{formatCents(recap.savedCents)}</strong>
          </p>
          <p>
            {formatCents(recap.spentCents)} dépensés sur un budget de {formatCents(recap.budgetCents)}.
          </p>
        </section>
      )}

      {recap.savedCents > 0 && (
        <section aria-labelledby="aside-title">
          <h3 id="aside-title">Mets-les de côté</h3>
          {recap.answer === 'DONE' ? (
            <p role="status">Bravo, {formatCents(recap.savedCents)} mis de côté pour {formatMonth(month)}.</p>
          ) : (
            <>
              <p>
                Vire ces {formatCents(recap.savedCents)} sur ton livret d’épargne dès aujourd’hui : l’argent qui reste sur le
                compte courant finit souvent par être dépensé.
              </p>
              {recap.answer === 'REMIND_LATER' && <p role="status">C’est noté, on te le rappellera demain.</p>}
              <button type="button" onClick={() => answer('DONE')}>
                C’est fait
              </button>{' '}
              {recap.answer !== 'REMIND_LATER' && (
                <button type="button" onClick={() => answer('REMIND_LATER')}>
                  Me le rappeler demain
                </button>
              )}
            </>
          )}
        </section>
      )}

      <section aria-labelledby="top-title">
        <h3 id="top-title">Ce qui a le plus pesé</h3>
        {recap.topCategories.length === 0 ? (
          <p>Aucune dépense ce mois-là.</p>
        ) : (
          <ol>
            {recap.topCategories.map((c) => (
              <li key={c.categoryId}>
                {categoryLabels[c.categoryId]} : {formatCents(c.amountCents)}
              </li>
            ))}
          </ol>
        )}
      </section>

      <p>Revenus du mois : {formatCents(recap.incomeCents)}</p>
      <p>
        <Link to={`/transactions?month=${month}`}>Voir les transactions de {formatMonth(month)}</Link>
      </p>
    </>
  );
}
