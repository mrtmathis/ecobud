import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../api.js';
import { categoryLabels, frequencyLabels } from '../categories.js';
import { formatCents, formatDay, inDays } from '../format.js';
import { errorMessage } from '../messages.js';

export default function Recurrences() {
  const [recurrences, setRecurrences] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/recurrences')
      .then((data) => setRecurrences(data.recurrences))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const replace = (updated) => setRecurrences((list) => list.map((r) => (r.id === updated.id ? updated : r)));

  const toggleReminder = async (r) => {
    try {
      const data = await api(`/recurrences/${r.id}/reminder`, { method: 'PATCH', body: { remindOn: !r.remindOn } });
      replace(data.recurrence);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const remove = async (r) => {
    if (!window.confirm(`Arrêter « ${r.label} » ? Les montants déjà ajoutés restent dans tes transactions.`)) return;
    try {
      await api(`/recurrences/${r.id}`, { method: 'DELETE' });
      setRecurrences((list) => list.filter((x) => x.id !== r.id));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <main>
      <h1>Récurrences</h1>
      <p>
        Loyer, abonnements, salaire… Saisis-les une fois : ils sont ajoutés automatiquement à tes transactions le jour
        du prélèvement.
      </p>
      <p>
        <Link to="/recurrences/new">Ajouter une récurrence</Link>
      </p>

      {error && <p role="alert">{error}</p>}
      {!recurrences && !error && <p>Chargement…</p>}
      {recurrences?.length === 0 && <p>Aucune récurrence pour l’instant.</p>}

      <ul>
        {recurrences?.map((r) => (
          <li key={r.id}>
            <strong>{r.label}</strong> · {r.type === 'EXPENSE' ? '−' : '+'}
            {formatCents(r.amountCents)} · {categoryLabels[r.categoryId]} · {frequencyLabels[r.frequency]}
            <br />
            {r.isTrial ? 'Fin de l’essai gratuit' : 'Prochain prélèvement'} : {formatDay(r.nextDate)} ({inDays(r.daysUntil)})
            {r.type === 'EXPENSE' && (
              <>
                <br />
                <label>
                  <input type="checkbox" checked={r.remindOn} onChange={() => toggleReminder(r)} /> Me prévenir{' '}
                  {r.remindDaysBefore === 1 ? 'la veille' : `${r.remindDaysBefore} jours avant`}
                </label>
              </>
            )}
            <br />
            <Link to={`/recurrences/${r.id}/edit`}>Modifier</Link>{' '}
            <button type="button" onClick={() => remove(r)}>
              Arrêter
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
