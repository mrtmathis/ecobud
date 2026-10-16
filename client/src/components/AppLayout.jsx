import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth.jsx';

// Menu shared by every page of the logged-in area
export default function AppLayout() {
  const { logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <nav aria-label={t('nav.label')}>
        <NavLink to="/dashboard">{t('nav.dashboard')}</NavLink> · <NavLink to="/transactions">{t('nav.transactions')}</NavLink> ·{' '}
        <NavLink to="/transactions/new" end>
          {t('common.addExpense')}
        </NavLink>{' '}
        · <Link to="/transactions/new?type=INCOME">{t('common.addIncome')}</Link> · <NavLink to="/budget">{t('nav.budget')}</NavLink> ·{' '}
        <NavLink to="/recurrences">{t('nav.recurrences')}</NavLink> · <NavLink to="/recap">{t('nav.recap')}</NavLink> ·{' '}
        <NavLink to="/account">{t('nav.account')}</NavLink> ·{' '}
        <button type="button" onClick={handleLogout}>
          {t('nav.logout')}
        </button>
      </nav>
      <hr />
      <Outlet />
    </>
  );
}
