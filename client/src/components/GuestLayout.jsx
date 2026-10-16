import { Outlet } from 'react-router';
import { Brand } from './AppLayout.jsx';
import LanguageToggle from './LanguageToggle.jsx';

// Frame of the visitor pages: logo, language switch, centered content
export default function GuestLayout() {
  return (
    <div className="guest">
      <header className="guest-head">
        <Brand />
        <LanguageToggle className="btn-ghost" />
      </header>
      <div className="guest-body">
        <Outlet />
      </div>
    </div>
  );
}
