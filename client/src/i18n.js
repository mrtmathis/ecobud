import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.js';
import en from './locales/en.js';

const STORAGE_KEY = 'ecobud_language';

// Last choice on this device, otherwise the browser language
function initialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'fr' || saved === 'en') return saved;
  } catch {
    // Storage blocked: fall back to the browser language
  }
  return navigator.language?.startsWith('fr') ? 'fr' : 'en';
}

// Switches the interface and remembers the choice on this device
export function applyLanguage(language) {
  if (language !== 'fr' && language !== 'en') return;
  i18n.changeLanguage(language);
  document.documentElement.lang = language;
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Not saved locally, the account still keeps it
  }
}

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: initialLanguage(),
  fallbackLng: 'fr',
  // React already escapes rendered text
  interpolation: { escapeValue: false },
});
document.documentElement.lang = i18n.language;

export default i18n;
