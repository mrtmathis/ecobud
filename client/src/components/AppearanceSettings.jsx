import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { errorMessage } from '../messages.js';
import { applyTheme } from '../theme.js';
import ThemePicker from './ThemePicker.jsx';

// "My account" section: the theme and the mode change at once and are saved on the account
export default function AppearanceSettings() {
  const { user, signIn } = useAuth();
  const { t } = useTranslation();
  const [error, setError] = useState('');

  const change = async (theme) => {
    applyTheme(theme);
    setError('');
    try {
      const data = await api('/settings/theme', { method: 'PUT', body: theme });
      signIn(data.user);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <section aria-labelledby="appearance-title">
      <h2 id="appearance-title">{t('theme.title')}</h2>
      <ThemePicker value={{ skin: user.skin, appearance: user.appearance }} onChange={change} />
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
