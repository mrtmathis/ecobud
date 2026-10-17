import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { errorMessage } from '../messages.js';
import PasswordInput from './PasswordInput.jsx';

// Last section of My account: deletes the account and all its data once the password is typed again
export default function DeleteAccount() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError('');
    try {
      await api('/account', { method: 'DELETE', body: { password } });
      // Full reload: nothing of the deleted account stays in memory, and the home page shows the confirmation
      window.location.replace('/?deleted=1');
    } catch (err) {
      setError(errorMessage(err));
      setSending(false);
    }
  };

  return (
    <section className="danger-zone" aria-labelledby="delete-section">
      <h2 id="delete-section">{t('account.deleteTitle')}</h2>
      <p>{t('account.deleteWarning')}</p>
      <p className="empty">{t('account.inactivityNote')}</p>
      {!open ? (
        <button type="button" className="danger" onClick={() => setOpen(true)}>
          {t('account.deleteTitle')}
        </button>
      ) : (
        <form onSubmit={submit} className="form-grid">
          <div className="field">
            <label htmlFor="delete-password">{t('account.deleteConfirm')}</label>
            <PasswordInput
              id="delete-password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p role="alert">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="danger" disabled={sending}>
              {t('account.deleteForever')}
            </button>
            <button type="button" className="link-button" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
