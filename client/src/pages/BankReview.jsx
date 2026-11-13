import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { categoryColor, useCategories } from '../categories.js';
import { formatCents, formatShortDay } from '../format.js';
import { errorMessage } from '../messages.js';
import Icon from '../components/Icon.jsx';

// Operations read from the bank wait here: each one is added to the history with a category, or ignored
export default function BankReview() {
  const { t } = useTranslation();
  const categories = useCategories();
  const [params] = useSearchParams();
  const result = params.get('result');
  const [state, setState] = useState(null);
  const [items, setItems] = useState(null);
  // Category chosen per operation, starting from the suggested one
  const [chosen, setChosen] = useState({});
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const info = await api('/bank');
    setState(info);
    if (!info.connection) return setItems([]);
    if (!info.connection.expired) await api('/bank/sync', { method: 'POST' }).catch((err) => setError(errorMessage(err)));
    const data = await api('/bank/imports');
    setItems(data.imports);
  };

  useEffect(() => {
    load().catch((err) => setError(errorMessage(err)));
  }, []);

  const categoryOf = (item) => chosen[item.id] ?? item.categoryId;
  const done = (id, message) => {
    setItems((list) => list.filter((i) => i.id !== id));
    setStatus(message);
  };

  const accept = async (item) => {
    try {
      await api(`/bank/imports/${item.id}/accept`, { method: 'POST', body: { categoryId: categoryOf(item) } });
      done(item.id, t('bank.added', { label: item.label }));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const ignore = async (item) => {
    try {
      await api(`/bank/imports/${item.id}/ignore`, { method: 'POST' });
      done(item.id, t('bank.ignored', { label: item.label }));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // Everything still listed is added with the category shown next to it
  const acceptAll = async () => {
    for (const item of [...items]) await accept(item);
    setStatus(t('bank.allAdded'));
  };

  if (state && !state.available) {
    return (
      <main>
        <h1>{t('bank.reviewTitle')}</h1>
        <p className="empty">{t('bank.unavailable')}</p>
      </main>
    );
  }

  return (
    <main className="bank-review">
      <div className="page-head">
        <h1>{t('bank.reviewTitle')}</h1>
        <p>{t('bank.reviewIntro')}</p>
        <p className="empty">{t('bank.duplicateHint')}</p>
      </div>

      {result && (
        <p role={result === 'connected' ? 'status' : 'alert'}>{t(`bank.result_${result}`, { defaultValue: t('bank.result_error') })}</p>
      )}
      {error && <p role="alert">{error}</p>}
      {status && <p role="status">{status}</p>}

      {state?.connection === null && (
        <p className="empty">
          {t('bank.notConnected')} <Link to="/account#bank-section">{t('bank.goToAccount')}</Link>
        </p>
      )}
      {state?.connection?.expired && (
        <p role="alert">
          {t('bank.expired')} <Link to="/account#bank-section">{t('bank.goToAccount')}</Link>
        </p>
      )}

      {items === null && !error && <p>{t('common.loading')}</p>}
      {items?.length === 0 && state?.connection && <p className="empty">{t('bank.nothingToReview')}</p>}
      {items?.length > 0 && (
        <>
          <div className="form-actions">
            <button type="button" className="primary" onClick={acceptAll}>
              <Icon name="check" size={18} /> {t('bank.acceptAll', { count: items.length })}
            </button>
          </div>
          <ul className="rows review-list">
            {items.map((item) => {
              const options = categories.filter((c) => c.type === item.type);
              return (
                <li key={item.id} className="review-item">
                  <span className="cat-dot" style={{ '--dot': categoryColor(categoryOf(item)) }} aria-hidden="true" />
                  <span className="row-main">
                    <strong>{item.label}</strong>
                    <small>{formatShortDay(item.date)}</small>
                  </span>
                  <span className={`row-amount tnum ${item.type === 'EXPENSE' ? 'is-expense' : 'is-income'}`}>
                    {item.type === 'EXPENSE' ? '−' : '+'}
                    {formatCents(item.amountCents)}
                  </span>
                  <div className="review-actions">
                    <label className="visually-hidden" htmlFor={`cat-${item.id}`}>
                      {t('bank.categoryFor', { label: item.label })}
                    </label>
                    <select id={`cat-${item.id}`} value={categoryOf(item)} onChange={(e) => setChosen({ ...chosen, [item.id]: e.target.value })}>
                      {options.map((c) => (
                        <option key={c.id} value={c.id}>
                          {t(`categories.${c.id}`)}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="primary" onClick={() => accept(item)} aria-label={t('bank.addLabel', { label: item.label })}>
                      {t('bank.add')}
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => ignore(item)} aria-label={t('bank.ignoreLabel', { label: item.label })}>
                      {t('bank.ignore')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
