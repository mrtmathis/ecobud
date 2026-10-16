import { Outlet, useLocation } from 'react-router';
import { Brand } from './AppLayout.jsx';
import LanguageToggle from './LanguageToggle.jsx';

// Frame of the visitor pages: logo, language switch, centered content (wider for the home page)
export default function GuestLayout() {
  const { pathname } = useLocation();
  return (
    <div className="guest">
      <header className="guest-head">
        <Brand />
        <LanguageToggle className="btn-ghost" />
      </header>
      <div className={pathname === '/' ? 'guest-body wide' : 'guest-body'}>
        <Outlet />
      </div>
    </div>
  );
}
