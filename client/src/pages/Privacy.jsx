import { useTranslation } from 'react-i18next';
import LegalPage from '../components/LegalPage.jsx';

const REPO_ISSUES = 'https://github.com/mrtmathis/ecobud/issues';

// Privacy policy (GDPR): what is collected, why, where it is stored, for how long and the user's rights
const content = {
  fr: [
    {
      title: 'En bref',
      text: [
        'EcoBud ne demande aucune donnée bancaire, n’affiche aucune publicité, ne revend rien et n’utilise aucun traceur publicitaire. Tes données servent uniquement à faire fonctionner l’application.',
      ],
    },
    {
      title: 'Responsable du traitement',
      text: [
        <>
          Mathis M., éditeur d’EcoBud (projet étudiant). Contact : une demande sur{' '}
          <a href={REPO_ISSUES}>GitHub</a>, sans y écrire d’information personnelle ; une réponse te sera faite pour
          convenir d’un moyen d’échange privé.
        </>,
      ],
    },
    {
      title: 'Les données collectées',
      text: ['Seulement ce qui est nécessaire au service :'],
      list: [
        'Ton compte : prénom, adresse e-mail, mot de passe et code de récupération. Le mot de passe et le code ne sont jamais stockés en clair : seule une empreinte chiffrée (bcrypt) est gardée, que personne ne peut relire.',
        'Ce que tu saisis : dépenses et revenus (montant, catégorie, date, note), budgets, récurrences et abonnements, réponses au récap du mois, jours « rien dépensé ».',
        'Tes réglages : langue, fuseau horaire, thème, rappels et alertes.',
        'Pour les notifications, si tu les actives : l’adresse d’envoi et les clés de chiffrement fournies par ton navigateur pour cet appareil.',
        'La date de ta dernière visite, pour supprimer les comptes inutilisés (voir plus bas).',
      ],
    },
    {
      title: 'Pourquoi',
      text: [
        'Ces données servent à te fournir le service que tu demandes en créant un compte : calculer ton budget, afficher ton historique, t’envoyer les rappels et alertes que tu as choisis (base légale : exécution du service, article 6.1.b du RGPD). Les informations que tu saisis n’ont pas besoin d’être exactes : elles ne sont vérifiées ni utilisées par personne d’autre que toi.',
      ],
    },
    {
      title: 'Où elles sont stockées',
      list: [
        'Base de données : Neon (PostgreSQL), région de Francfort, Allemagne (Union européenne).',
        'Serveur de l’application : Vercel, région de Francfort, Allemagne. Vercel étant une société américaine, elle applique le cadre de protection des données UE et États-Unis (Data Privacy Framework).',
        'Notifications : elles passent par le service de ton navigateur ou de ton téléphone (Apple, Google ou Mozilla). Leur contenu est chiffré de bout en bout : ces services transportent le message sans pouvoir le lire.',
      ],
      text: [],
    },
    {
      title: 'Combien de temps',
      text: [
        'Tes données sont gardées tant que ton compte existe. Elles sont effacées immédiatement quand tu supprimes ton compte, ou automatiquement après 90 jours sans aucune visite. Si les notifications sont activées, tu es prévenu 7 jours avant. Les copies de sauvegarde techniques de l’hébergeur disparaissent ensuite d’elles-mêmes en quelques jours.',
      ],
    },
    {
      title: 'Cookies et stockage sur ton appareil',
      list: [
        'Un seul cookie, « ecobud_session », pour rester connecté (30 jours). Il est indispensable au fonctionnement et ne sert à aucun suivi, donc il ne demande pas de consentement.',
        'Ta langue et ton thème sont aussi gardés dans ton navigateur, pour afficher la bonne apparence dès l’ouverture.',
      ],
      text: [],
    },
    {
      title: 'Statistiques de visite',
      text: [
        'EcoBud utilise Vercel Web Analytics pour compter les visites de façon anonyme : pages vues, pays, type d’appareil et de navigateur. Cet outil ne dépose aucun cookie, ne te suit pas d’un site à l’autre et ne permet pas de savoir qui tu es. Il ne lit aucune de tes données de budget (base légale : intérêt légitime à améliorer le site, article 6.1.f du RGPD).',
      ],
    },
    {
      title: 'Tes droits',
      text: ['Tu peux exercer la plupart de tes droits directement dans l’application, sans rien demander à personne :'],
      list: [
        'Accès et portabilité : Mon compte, « Voir et télécharger mes données », pour lire tout ce qui est gardé sur toi et l’enregistrer en PDF (ou en fichier JSON pour un autre logiciel).',
        'Rectification : modifie tes dépenses, budgets, récurrences et réglages à tout moment.',
        'Effacement : Mon compte, « Supprimer mon compte », qui efface tout immédiatement.',
        'Opposition et limitation : désactive les notifications, les rappels ou les alertes dans Mon compte.',
      ],
    },
    {
      title: 'Réclamation',
      text: [
        <>
          Si tu estimes que tes droits ne sont pas respectés, tu peux adresser une réclamation à la CNIL :{' '}
          <a href="https://www.cnil.fr/fr/plaintes">cnil.fr/fr/plaintes</a>.
        </>,
      ],
    },
    {
      title: 'Âge minimum',
      text: ['EcoBud s’adresse aux étudiants. Si tu as moins de 15 ans, demande l’accord d’un parent avant de créer un compte.'],
    },
  ],
  en: [
    {
      title: 'In short',
      text: [
        'EcoBud never asks for bank details, shows no ads, sells nothing and uses no advertising trackers. Your data is only used to run the app.',
      ],
    },
    {
      title: 'Data controller',
      text: [
        <>
          Mathis M., publisher of EcoBud (student project). Contact: a request on <a href={REPO_ISSUES}>GitHub</a>,
          without any personal information in it; you will get an answer to agree on a private way to talk.
        </>,
      ],
    },
    {
      title: 'Data collected',
      text: ['Only what the service needs:'],
      list: [
        'Your account: first name, email address, password and recovery code. The password and code are never stored as plain text: only an encrypted fingerprint (bcrypt) is kept, which nobody can read back.',
        'What you type in: expenses and income (amount, category, date, note), budgets, recurring items and subscriptions, answers to the monthly recap, “nothing spent” days.',
        'Your settings: language, time zone, theme, reminders and alerts.',
        'For notifications, if you turn them on: the delivery address and encryption keys your browser gives for this device.',
        'The date of your last visit, to delete unused accounts (see below).',
      ],
    },
    {
      title: 'Why',
      text: [
        'This data is used to provide the service you ask for when you create an account: working out your budget, showing your history, sending the reminders and alerts you chose (legal basis: performance of the service, GDPR article 6.1.b). What you type does not need to be accurate: nobody but you checks or uses it.',
      ],
    },
    {
      title: 'Where it is stored',
      list: [
        'Database: Neon (PostgreSQL), Frankfurt region, Germany (European Union).',
        'App server: Vercel, Frankfurt region, Germany. As an American company, Vercel follows the EU and US Data Privacy Framework.',
        'Notifications: they go through your browser or phone service (Apple, Google or Mozilla). Their content is end to end encrypted: these services carry the message without being able to read it.',
      ],
      text: [],
    },
    {
      title: 'How long',
      text: [
        'Your data is kept as long as your account exists. It is erased at once when you delete your account, or automatically after 90 days without any visit. If notifications are on, you are warned 7 days before. The host’s technical backups then disappear by themselves within a few days.',
      ],
    },
    {
      title: 'Cookies and storage on your device',
      list: [
        'A single cookie, “ecobud_session”, to keep you logged in (30 days). It is needed for the app to work and is not used for tracking, so it does not require consent.',
        'Your language and theme are also kept in your browser, to show the right look as soon as the app opens.',
      ],
      text: [],
    },
    {
      title: 'Visit statistics',
      text: [
        'EcoBud uses Vercel Web Analytics to count visits anonymously: pages viewed, country, device and browser type. This tool sets no cookie, does not follow you across sites and cannot tell who you are. It reads none of your budget data (legal basis: legitimate interest in improving the site, GDPR article 6.1.f).',
      ],
    },
    {
      title: 'Your rights',
      text: ['You can use most of your rights directly in the app, without asking anyone:'],
      list: [
        'Access and portability: My account, “See and download my data”, to read everything kept about you and save it as a PDF (or as a JSON file for another program).',
        'Correction: edit your expenses, budgets, recurring items and settings at any time.',
        'Erasure: My account, “Delete my account”, which erases everything at once.',
        'Objection and restriction: turn off notifications, reminders or alerts in My account.',
      ],
    },
    {
      title: 'Complaint',
      text: [
        <>
          If you think your rights are not respected, you can complain to the French data protection authority (CNIL):{' '}
          <a href="https://www.cnil.fr/fr/plaintes">cnil.fr/fr/plaintes</a>.
        </>,
      ],
    },
    {
      title: 'Minimum age',
      text: ['EcoBud is made for students. If you are under 15, ask a parent before creating an account.'],
    },
  ],
};

export default function Privacy() {
  const { t, i18n } = useTranslation();
  return <LegalPage title={t('legal.privacyTitle')} sections={content[i18n.language] || content.fr} />;
}
