// Notification texts in the user's language
const locales = { fr: 'fr-FR', en: 'en-GB' };

const money = (language, cents) =>
  new Intl.NumberFormat(locales[language], { style: 'currency', currency: 'EUR' }).format(cents / 100);

// "2026-09" -> "septembre" or "September"
const monthName = (language, month) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(locales[language], { month: 'long', timeZone: 'UTC' });
};

const texts = {
  fr: {
    test: () => ({ title: 'EcoBud', body: 'Les notifications fonctionnent sur cet appareil.' }),
    reminder: () => ({
      title: 'Tes dépenses du jour',
      body: 'Prends 10 secondes pour noter ce que tu as dépensé aujourd’hui.',
      actions: [
        { action: 'add', title: 'Ajouter une dépense' },
        { action: 'nothing', title: 'Rien dépensé' },
      ],
      doneText: 'Journée validée : rien dépensé.',
    }),
    budget80: ({ percent, remainingCents }) => ({
      title: `${percent} % de ton budget utilisé`,
      body: `Il te reste ${money('fr', remainingCents)} pour finir le mois.`,
    }),
    budgetOver: ({ overCents }) => ({
      title: 'Budget dépassé',
      body: `Tu as dépassé ton budget du mois de ${money('fr', overCents)}. Essaie de limiter les dépenses jusqu’à la fin du mois.`,
    }),
    debitSoon: ({ label, amountCents, days }) => ({
      title: `${label} : prélèvement ${days === 1 ? 'demain' : `dans ${days} jours`}`,
      body: `${money('fr', amountCents)} vont être prélevés. Résilie avant si tu ne t’en sers plus.`,
    }),
    trialEnd: ({ label, amountCents, days }) => ({
      title: `Fin de l’essai ${label} ${days === 1 ? 'demain' : `dans ${days} jours`}`,
      body: `Ensuite, ${money('fr', amountCents)} seront prélevés. Résilie avant si tu ne veux pas continuer.`,
    }),
    recapReady: ({ month, savedCents }) => ({
      title: `Ton récap de ${monthName('fr', month)} est prêt`,
      body:
        savedCents > 0
          ? `Tu as économisé ${money('fr', savedCents)}. Pense à les mettre de côté.`
          : 'Découvre ce qui a le plus pesé dans ton budget.',
    }),
    recapReminder: ({ month, savedCents }) => ({
      title: 'Rappel : mets tes économies de côté',
      body: `Tu voulais mettre ${money('fr', savedCents)} de côté pour ${monthName('fr', month)}.`,
    }),
  },
  en: {
    test: () => ({ title: 'EcoBud', body: 'Notifications work on this device.' }),
    reminder: () => ({
      title: 'Your expenses today',
      body: 'Take 10 seconds to log what you spent today.',
      actions: [
        { action: 'add', title: 'Add an expense' },
        { action: 'nothing', title: 'Nothing spent' },
      ],
      doneText: 'Day checked: nothing spent.',
    }),
    budget80: ({ percent, remainingCents }) => ({
      title: `${percent}% of your budget used`,
      body: `You have ${money('en', remainingCents)} left for the rest of the month.`,
    }),
    budgetOver: ({ overCents }) => ({
      title: 'Budget exceeded',
      body: `You went over your monthly budget by ${money('en', overCents)}. Try to limit spending until the end of the month.`,
    }),
    debitSoon: ({ label, amountCents, days }) => ({
      title: `${label}: debit ${days === 1 ? 'tomorrow' : `in ${days} days`}`,
      body: `${money('en', amountCents)} will be taken. Cancel before if you no longer use it.`,
    }),
    trialEnd: ({ label, amountCents, days }) => ({
      title: `${label} free trial ends ${days === 1 ? 'tomorrow' : `in ${days} days`}`,
      body: `After that, ${money('en', amountCents)} will be taken. Cancel before if you do not want to keep it.`,
    }),
    recapReady: ({ month, savedCents }) => ({
      title: `Your ${monthName('en', month)} recap is ready`,
      body:
        savedCents > 0
          ? `You saved ${money('en', savedCents)}. Remember to put it aside.`
          : 'See what weighed the most on your budget.',
    }),
    recapReminder: ({ month, savedCents }) => ({
      title: 'Reminder: put your savings aside',
      body: `You wanted to put ${money('en', savedCents)} aside for ${monthName('en', month)}.`,
    }),
  },
};

export const notificationText = (language, key, params = {}) => (texts[language] || texts.fr)[key](params);
