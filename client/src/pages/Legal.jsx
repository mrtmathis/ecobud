import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import LegalPage from '../components/LegalPage.jsx';

const REPO = 'https://github.com/mrtmathis/ecobud';

// Legal notice required by French law (LCEN): who publishes the site, who hosts it, how to reach them
const content = {
  fr: [
    {
      title: 'Éditeur du site',
      text: [
        'EcoBud est un projet étudiant non commercial, réalisé et publié par Mathis M., particulier.',
        'Directeur de la publication : Mathis M.',
        <>
          Contact : en ouvrant une demande (« issue ») sur le dépôt GitHub du projet,{' '}
          <a href={`${REPO}/issues`}>{REPO.replace('https://', '')}/issues</a>. Ces demandes sont publiques : n’y écris
          jamais d’information personnelle (adresse e-mail, montants…).
        </>,
      ],
    },
    {
      title: 'Hébergement',
      text: [
        'Site et serveur : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com). Le serveur de l’application fonctionne dans la région de Francfort (Allemagne).',
        'Base de données : Neon, région de Francfort (Allemagne), sur l’infrastructure d’Amazon Web Services.',
      ],
    },
    {
      title: 'Propriété intellectuelle',
      text: [
        <>
          Le code source est consultable publiquement sur <a href={REPO}>GitHub</a> pour présenter le projet. Sauf
          mention contraire, le code, les textes, le logo et le design d’EcoBud restent la propriété de leur auteur.
        </>,
        'Les polices de caractères utilisées sont distribuées sous licence libre SIL Open Font License.',
      ],
    },
    {
      title: 'Responsabilité',
      text: [
        'EcoBud est un outil d’aide au suivi de budget. Les montants sont saisis par l’utilisateur et ne sont reliés à aucun compte bancaire : ils ne remplacent pas un relevé de banque ni un conseil financier.',
      ],
    },
    {
      title: 'Données personnelles',
      text: [
        <>
          La façon dont tes données sont utilisées et protégées est décrite dans la page{' '}
          <Link to="/privacy">Confidentialité</Link>.
        </>,
      ],
    },
  ],
  en: [
    {
      title: 'Publisher',
      text: [
        'EcoBud is a non commercial student project, made and published by Mathis M., a private individual.',
        'Publication director: Mathis M.',
        <>
          Contact: open a request (“issue”) on the project’s GitHub repository,{' '}
          <a href={`${REPO}/issues`}>{REPO.replace('https://', '')}/issues</a>. These requests are public: never write
          personal information there (email address, amounts…).
        </>,
      ],
    },
    {
      title: 'Hosting',
      text: [
        'Website and server: Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, United States (vercel.com). The app server runs in the Frankfurt region (Germany).',
        'Database: Neon, Frankfurt region (Germany), on Amazon Web Services infrastructure.',
      ],
    },
    {
      title: 'Intellectual property',
      text: [
        <>
          The source code is publicly available on <a href={REPO}>GitHub</a> to present the project. Unless stated
          otherwise, EcoBud’s code, texts, logo and design remain the property of their author.
        </>,
        'The fonts used are distributed under the free SIL Open Font License.',
      ],
    },
    {
      title: 'Liability',
      text: [
        'EcoBud helps you follow a budget. Amounts are typed in by the user and are not linked to any bank account: they do not replace a bank statement or financial advice.',
      ],
    },
    {
      title: 'Personal data',
      text: [
        <>
          How your data is used and protected is explained on the <Link to="/privacy">Privacy</Link> page.
        </>,
      ],
    },
  ],
};

export default function Legal() {
  const { t, i18n } = useTranslation();
  return <LegalPage title={t('legal.legalTitle')} sections={content[i18n.language] || content.fr} />;
}
