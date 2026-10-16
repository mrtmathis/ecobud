// Notification texts in the user's language
const texts = {
  fr: {
    test: () => ({ title: 'EcoBud', body: 'Les notifications fonctionnent sur cet appareil.' }),
  },
  en: {
    test: () => ({ title: 'EcoBud', body: 'Notifications work on this device.' }),
  },
};

export const notificationText = (language, key, params = {}) => (texts[language] || texts.fr)[key](params);
