import { Link, Outlet, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Brand } from './AppLayout.jsx';
import LanguageToggle from './LanguageToggle.jsx';

// Frame of the visitor pages: logo, language switch, centered content (wider for the home page), legal links
export default function GuestLayout() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  return (
    <div className="guest">
      <header className="guest-head">
        <Brand />
        <LanguageToggle className="btn-ghost" />
      </header>
      <div className={pathname === '/' ? 'guest-body wide' : 'guest-body'}>
        <Outlet />
      </div>
      <footer className="guest-foot">
        <Link to="/privacy">{t('legal.privacyTitle')}</Link>
        <Link to="/legal">{t('legal.legalTitle')}</Link>
      </footer>
    </div>
  );
}
