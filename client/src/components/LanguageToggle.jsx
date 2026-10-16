import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { applyLanguage } from '../i18n.js';

// One button that flips between French and English, saved on the account when logged in
export default function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const { user, signIn } = useAuth();

  const toggle = async () => {
    const language = i18n.language === 'fr' ? 'en' : 'fr';
    applyLanguage(language);
    if (!user) return;
    try {
      const data = await api('/settings/language', { method: 'PUT', body: { language } });
      signIn(data.user);
    } catch {
      // The interface is already switched, the account keeps the old value until next time
    }
  };

  return (
    <button type="button" lang={i18n.language === 'fr' ? 'en' : 'fr'} aria-label={t('language.switchLabel')} onClick={toggle}>
      {t('language.switch')}
    </button>
  );
}
