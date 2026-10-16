import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { thisMonth } from '../format.js';
import BudgetHero from '../components/BudgetHero.jsx';
import Icon from '../components/Icon.jsx';

// Sample month shown on the landing page, drawn in the current theme
const sample = {
  budgetCents: 90000,
  spentCents: 54560,
  remainingCents: 35440,
  percentUsed: 61,
  alertLevel: null,
};

export default function Home() {
  const { t } = useTranslation();
  const skin = document.documentElement.dataset.skin || 'ticket';
  const features = [
    { icon: 'plus', text: t('home.featureAdd') },
    { icon: 'bell', text: t('home.featureReminder') },
    { icon: 'pie', text: t('home.featureRecap') },
  ];

  return (
    <main className="landing">
      <div className="landing-text">
        <h1>{t('home.tagline')}</h1>
        <p className="landing-pitch">{t('home.pitch')}</p>
        <div className="form-actions">
          <Link to="/register" className="btn">
            {t('auth.register')}
          </Link>
          <Link to="/login" className="btn btn-ghost">
            {t('auth.login')}
          </Link>
        </div>
        <ul className="features">
          {features.map((f) => (
            <li key={f.icon}>
              <span className="feature-icon" aria-hidden="true">
                <Icon name={f.icon} size={18} />
              </span>
              {f.text}
            </li>
          ))}
        </ul>
      </div>
      <figure className="landing-demo">
        <div aria-hidden="true">
          <BudgetHero data={{ ...sample, month: thisMonth() }} skin={skin} />
        </div>
        <figcaption>{t('home.sample')}</figcaption>
      </figure>
    </main>
  );
}
