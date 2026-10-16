import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { formatCents, formatDay, inDays } from '../format.js';
import { errorMessage } from '../messages.js';

export default function Recurrences() {
  const { t } = useTranslation();
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
    if (!window.confirm(t('recurrences.confirmStop', { label: r.label }))) return;
    try {
      await api(`/recurrences/${r.id}`, { method: 'DELETE' });
      setRecurrences((list) => list.filter((x) => x.id !== r.id));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <main>
      <h1>{t('recurrences.title')}</h1>
      <p>{t('recurrences.intro')}</p>
      <p>
        <Link to="/recurrences/new">{t('recurrences.add')}</Link>
      </p>

      {error && <p role="alert">{error}</p>}
      {!recurrences && !error && <p>{t('common.loading')}</p>}
      {recurrences?.length === 0 && <p>{t('recurrences.empty')}</p>}

      <ul>
        {recurrences?.map((r) => (
          <li key={r.id}>
            <strong>{r.label}</strong> · {r.type === 'EXPENSE' ? '−' : '+'}
            {formatCents(r.amountCents)} · {t(`categories.${r.categoryId}`)} · {t(`frequency.${r.frequency}`)}
            <br />
            {t(r.isTrial ? 'recurrences.trialEnd' : 'recurrences.nextDebit', {
              date: formatDay(r.nextDate),
              when: inDays(r.daysUntil),
            })}
            {r.type === 'EXPENSE' && (
              <>
                <br />
                <label>
                  <input type="checkbox" checked={r.remindOn} onChange={() => toggleReminder(r)} />{' '}
                  {r.remindDaysBefore === 1
                    ? t('recurrences.remindDayBefore')
                    : t('recurrences.remindDaysBefore', { count: r.remindDaysBefore })}
                </label>
              </>
            )}
            <br />
            <Link to={`/recurrences/${r.id}/edit`}>{t('common.edit')}</Link>{' '}
            <button type="button" onClick={() => remove(r)}>
              {t('recurrences.stop')}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
