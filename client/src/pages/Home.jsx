import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();
  return (
    <main>
      <h1>EcoBud</h1>
      <p>{t('home.tagline')}</p>
      <p>{t('home.pitch')}</p>
      <p>
        <Link to="/register">{t('auth.register')}</Link> · <Link to="/login">{t('auth.login')}</Link>
      </p>
    </main>
  );
}
