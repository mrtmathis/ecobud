import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { categoryColor } from '../categories.js';
import { dayParts, formatCents, inDays } from '../format.js';
import { errorMessage } from '../messages.js';
import Icon from '../components/Icon.jsx';

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
      <div className="page-head">
        <h1>{t('recurrences.title')}</h1>
        <Link to="/recurrences/new" className="btn">
          <Icon name="plus" size={18} /> {t('recurrences.add')}
        </Link>
        <p>{t('recurrences.intro')}</p>
      </div>

      {error && <p role="alert">{error}</p>}
      {!recurrences && !error && <p>{t('common.loading')}</p>}
      {recurrences?.length === 0 && (
        <section>
          <p className="empty">{t('recurrences.empty')}</p>
        </section>
      )}

      {recurrences?.map((r) => {
        const date = dayParts(r.nextDate);
        return (
          <section key={r.id} className="recurrence" aria-label={r.label}>
            <div className="row with-actions">
              <span className="date-chip" aria-hidden="true">
                <b>{date.day}</b>
                <small>{date.month}</small>
              </span>
              <span className="row-main">
                <strong>{r.label}</strong>
                <small>
                  <span className="mini-dot" style={{ '--dot': categoryColor(r.categoryId) }} aria-hidden="true" />{' '}
                  {t(`categories.${r.categoryId}`)} · {t(`frequency.${r.frequency}`)}
                </small>
              </span>
              <span className={`row-amount tnum ${r.type === 'EXPENSE' ? 'is-expense' : 'is-income'}`}>
                {r.type === 'EXPENSE' ? '−' : '+'}
                {formatCents(r.amountCents)}
              </span>
              <span className="row-actions">
                <Link to={`/recurrences/${r.id}/edit`} className="icon-button" aria-label={t('common.edit')}>
                  <Icon name="edit" size={18} />
                </Link>
                <button type="button" className="icon-button danger" aria-label={t('recurrences.stop')} onClick={() => remove(r)}>
                  <Icon name="trash" size={18} />
                </button>
              </span>
            </div>
            <div className="recurrence-foot">
              <span>
                {r.isTrial && <span className="tag">{t('dashboard.trialEnds')}</span>}{' '}
                {t(r.isTrial ? 'recurrences.trialEndShort' : 'recurrences.nextDebitShort', { when: inDays(r.daysUntil) })}
              </span>
              {r.type === 'EXPENSE' && (
                <label className="switch">
                  <input type="checkbox" checked={r.remindOn} onChange={() => toggleReminder(r)} />
                  <span>
                    <Icon name="bell" size={16} />{' '}
                    {r.remindDaysBefore === 1
                      ? t('recurrences.remindDayBefore')
                      : t('recurrences.remindDaysBefore', { count: r.remindDaysBefore })}
                  </span>
                </label>
              )}
            </div>
          </section>
        );
      })}
    </main>
  );
}
