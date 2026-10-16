import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { errorMessage } from '../messages.js';
import { applyTheme } from '../theme.js';
import ThemePicker from '../components/ThemePicker.jsx';

// Shown once, at the first sign in: the user picks the look of the app
export default function Welcome() {
  const { user, signIn } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState({ skin: user.skin, appearance: user.appearance });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  // The whole page previews the theme as soon as it is picked
  const change = (next) => {
    setTheme(next);
    applyTheme(next);
  };

  const save = async () => {
    setSending(true);
    setError('');
    try {
      const data = await api('/settings/theme', { method: 'PUT', body: theme });
      signIn(data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setSending(false);
    }
  };

  return (
    <main>
      <div>
        <h1>{t('theme.welcomeTitle', { name: user.name })}</h1>
        <p>{t('theme.welcomeIntro')}</p>
      </div>
      <ThemePicker value={theme} onChange={change} />
      {error && <p role="alert">{error}</p>}
      <div>
        <button type="button" className="primary" onClick={save} disabled={sending}>
          {t('theme.start')}
        </button>
      </div>
    </main>
  );
}
