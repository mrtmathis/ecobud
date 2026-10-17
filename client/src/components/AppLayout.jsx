import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth.jsx';
import Icon from './Icon.jsx';
import LanguageToggle from './LanguageToggle.jsx';
import Logo from './Logo.jsx';
import PageError from './PageError.jsx';

// Logo shared by the side menu and the visitor pages
export function Brand({ to = '/' }) {
  return (
    <Link to={to} className="brand">
      <Logo />
      EcoBud
    </Link>
  );
}

// Frame of the logged-in area: side menu on computers, tab bar and "more" sheet on phones
export default function AppLayout() {
  const { logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Escape closes the sheet
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (event) => event.key === 'Escape' && setMoreOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  const close = () => setMoreOpen(false);

  const mainLinks = [
    { to: '/dashboard', icon: 'home', label: t('nav.dashboard') },
    { to: '/transactions', icon: 'list', label: t('nav.transactions'), end: true },
    { to: '/budget', icon: 'wallet', label: t('nav.budget') },
    { to: '/recurrences', icon: 'repeat', label: t('nav.recurrences') },
    { to: '/recap', icon: 'pie', label: t('nav.recap') },
    { to: '/account', icon: 'user', label: t('nav.account') },
  ];

  return (
    <div className="shell">
      <aside className="sidebar" aria-label={t('nav.label')}>
        <Brand to="/dashboard" />
        <div className="add-row">
          <Link to="/transactions/new" className="btn">
            <Icon name="plus" size={18} /> {t('common.addExpense')}
          </Link>
          <Link to="/transactions/new?type=INCOME" className="btn btn-ghost">
            <Icon name="income" size={18} /> {t('common.addIncome')}
          </Link>
        </div>
        <nav>
          {mainLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className="menu-link">
              <Icon name={link.icon} /> {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="menu-foot">
          <LanguageToggle className="menu-link" />
          <button type="button" className="menu-link" onClick={handleLogout}>
            <Icon name="logout" /> {t('nav.logout')}
          </button>
        </div>
      </aside>

      <div className="content">
        {/* The menu stays in place while a page is downloading */}
        <PageError>
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </PageError>
      </div>

      <nav className="tabbar" aria-label={t('nav.label')}>
        <NavLink to="/dashboard" className="tab">
          <Icon name="home" /> {t('nav.home')}
        </NavLink>
        <NavLink to="/transactions" end className="tab">
          <Icon name="list" /> {t('nav.history')}
        </NavLink>
        <Link to="/transactions/new" className="tab-add" aria-label={t('common.addExpense')}>
          <Icon name="plus" size={28} />
        </Link>
        <NavLink to="/budget" className="tab">
          <Icon name="wallet" /> {t('nav.budget')}
        </NavLink>
        <button type="button" className="tab" aria-expanded={moreOpen} onClick={() => setMoreOpen(true)}>
          <Icon name="more" /> {t('nav.more')}
        </button>
      </nav>

      {moreOpen && (
        <>
          <div className="sheet-backdrop" onClick={close} aria-hidden="true" />
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="more-title">
            <div className="sheet-head">
              <h2 id="more-title">{t('nav.more')}</h2>
              <button type="button" className="menu-link" onClick={close} aria-label={t('common.close')}>
                <Icon name="close" />
              </button>
            </div>
            <Link to="/transactions/new?type=INCOME" className="menu-link" onClick={close}>
              <Icon name="income" /> {t('common.addIncome')}
            </Link>
            {mainLinks.slice(3).map((link) => (
              <NavLink key={link.to} to={link.to} className="menu-link" onClick={close}>
                <Icon name={link.icon} /> {link.label}
              </NavLink>
            ))}
            <div className="menu-foot">
              <LanguageToggle className="menu-link" />
              <button type="button" className="menu-link" onClick={handleLogout}>
                <Icon name="logout" /> {t('nav.logout')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
