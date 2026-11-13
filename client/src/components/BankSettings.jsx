import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { formatDay } from '../format.js';
import { errorMessage } from '../messages.js';
import Icon from './Icon.jsx';

// "My bank" in My account: link a bank (read only) or see and end the current link; hidden when the feature is off for this account
export default function BankSettings() {
  const { t } = useTranslation();
  const [state, setState] = useState(null);
  const [banks, setBanks] = useState(null);
  const [bank, setBank] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/bank')
      .then(setState)
      .catch(() => setState({ available: false }));
  }, []);

  if (!state?.available) return null;
  const connection = state.connection;

  const showBanks = async () => {
    setError('');
    try {
      const data = await api('/bank/banks');
      setBanks(data.banks);
      setBank(data.banks[0] ? JSON.stringify(data.banks[0]) : '');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // The bank's own page opens; it sends the user back to /bank once done
  const connect = async () => {
    setBusy(true);
    setError('');
    try {
      const { url } = await api('/bank/connect', { method: 'POST', body: JSON.parse(bank) });
      window.location.assign(url);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm(t('bank.disconnectConfirm'))) return;
    try {
      await api('/bank', { method: 'DELETE' });
      setState({ ...state, connection: null, pending: 0 });
      setBanks(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <section aria-labelledby="bank-section" className="bank-settings">
      <h2 id="bank-section">{t('bank.title')}</h2>
      {connection ? (
        <>
          <p>
            <strong>{connection.bankName}</strong>
            <br />
            {connection.expired
              ? t('bank.expired')
              : t('bank.validUntil', { date: formatDay(connection.validUntil.slice(0, 10)), count: connection.daysLeft })}
          </p>
          {connection.lastSyncAt && <p className="empty">{t('bank.lastSync', { date: new Date(connection.lastSyncAt).toLocaleString() })}</p>}
          <div className="form-actions">
            <Link to="/bank" className="btn">
              {t('bank.review', { count: state.pending })}
            </Link>
            {connection.expired && (
              <button type="button" onClick={showBanks}>
                {t('bank.renew')}
              </button>
            )}
            <button type="button" className="btn-ghost" onClick={disconnect}>
              {t('bank.disconnect')}
            </button>
          </div>
        </>
      ) : (
        <>
          <p>{t('bank.intro')}</p>
          <ul className="bank-points">
            <li>
              <Icon name="check" size={18} /> {t('bank.pointReadOnly')}
            </li>
            <li>
              <Icon name="check" size={18} /> {t('bank.pointCredentials')}
            </li>
            <li>
              <Icon name="check" size={18} /> {t('bank.pointMinimal')}
            </li>
          </ul>
          {!banks && (
            <button type="button" onClick={showBanks}>
              {t('bank.connect')}
            </button>
          )}
        </>
      )}
      {banks && (
        <div className="form-grid">
          <div className="field">
            <label htmlFor="bank-choice">{t('bank.choose')}</label>
            <select id="bank-choice" value={bank} onChange={(e) => setBank(e.target.value)}>
              {banks.map((b) => (
                <option key={`${b.name}-${b.country}`} value={JSON.stringify(b)}>
                  {b.name}
                </option>
              ))}
            </select>
            <small>{t('bank.redirectHint')}</small>
          </div>
          <div className="form-actions">
            <button type="button" className="primary" onClick={connect} disabled={busy || !bank}>
              {t('bank.goToBank')}
            </button>
          </div>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
