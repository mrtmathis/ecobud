import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { errorMessage } from '../messages.js';
import DeleteAccount from '../components/DeleteAccount.jsx';
import MyData from '../components/MyData.jsx';
import Icon from '../components/Icon.jsx';
import AppearanceSettings from '../components/AppearanceSettings.jsx';
import InstallApp from '../components/InstallApp.jsx';
import LanguageToggle from '../components/LanguageToggle.jsx';
import NotificationSettings from '../components/NotificationSettings.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import RecoveryCode from '../components/RecoveryCode.jsx';

export default function Account() {
  const { user, signIn, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [newCode, setNewCode] = useState(null);

  // Opens the first-login guide again; it ends on the dashboard
  const replayGuide = async () => {
    try {
      const data = await api('/settings/onboarding', { method: 'PUT', body: { done: false } });
      signIn(data.user);
      navigate('/welcome');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

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
      <div className="profile">
        <span className="avatar" aria-hidden="true">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div>
          <h1>{t('account.title')}</h1>
          <p>
            {user.name} · {user.email}
          </p>
        </div>
      </div>

      <section aria-labelledby="language-section">
        <h2 id="language-section">{t('account.language')}</h2>
        <p>
          {user.language === 'en' ? 'English' : 'Français'} · <LanguageToggle />
        </p>
      </section>

      <AppearanceSettings />

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

      <MyData />

      <section aria-labelledby="guide-section">
        <h2 id="guide-section">{t('account.guideTitle')}</h2>
        <p>{t('account.guideHint')}</p>
        <button type="button" onClick={replayGuide}>
          {t('account.guideReplay')}
        </button>
      </section>

      <section aria-labelledby="session-section">
        <h2 id="session-section">{t('account.sessionTitle')}</h2>
        <p>{t('account.sessionHint')}</p>
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/');
          }}
        >
          <Icon name="logout" size={18} /> {t('nav.logout')}
        </button>
      </section>

      <DeleteAccount />
    </main>
  );
}
