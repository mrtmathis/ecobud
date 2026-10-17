import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Icon from './Icon.jsx';

// My account: link to the page listing everything the app keeps about the user, and the legal pages
export default function MyData() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="data-section">
      <h2 id="data-section">{t('account.dataTitle')}</h2>
      <p>{t('account.dataHint')}</p>
      <Link to="/account/data" className="btn btn-ghost">
        <Icon name="download" size={18} /> {t('account.dataDownload')}
      </Link>
      <p className="legal-links">
        <Link to="/privacy">{t('legal.privacyTitle')}</Link> · <Link to="/legal">{t('legal.legalTitle')}</Link>
      </p>
    </section>
  );
}
