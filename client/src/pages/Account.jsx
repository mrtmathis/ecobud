import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { errorMessage } from '../messages.js';
import InstallApp from '../components/InstallApp.jsx';
import LanguageToggle from '../components/LanguageToggle.jsx';
import NotificationSettings from '../components/NotificationSettings.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import RecoveryCode from '../components/RecoveryCode.jsx';

export default function Account() {
  const { user, signIn } = useAuth();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [newCode, setNewCode] = useState(null);

  const regenerate = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const data = await api('/auth/recovery-code', { method: 'POST', body: { password } });
      setPassword('');
      setNewCode(data);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (newCode) {
    return (
      <main>
        <RecoveryCode
          code={newCode.recoveryCode}
          onDone={() => {
            signIn(newCode.user);
            setNewCode(null);
          }}
        />
      </main>
    );
  }

  return (
    <main>
      <h1>{t('account.title')}</h1>
      <p>
        {user.name} · {user.email}
      </p>

      <section aria-labelledby="language-section">
        <h2 id="language-section">{t('account.language')}</h2>
        <p>
          {user.language === 'en' ? 'English' : 'Français'} · <LanguageToggle />
        </p>
      </section>

      <InstallApp />

      <NotificationSettings />

      <section aria-labelledby="recovery-section">
        <h2 id="recovery-section">{t('account.recoveryTitle')}</h2>
        {user.hasRecoveryCode ? <p>{t('account.hasCode')}</p> : <p role="alert">{t('account.noCode')}</p>}
        <form onSubmit={regenerate}>
          <label htmlFor="current-password">{t('account.confirmPassword')}</label>
          <br />
          <PasswordInput
            id="current-password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />{' '}
          <button type="submit">{user.hasRecoveryCode ? t('account.regenerate') : t('account.generate')}</button>
        </form>
        {error && <p role="alert">{error}</p>}
      </section>
    </main>
  );
}
