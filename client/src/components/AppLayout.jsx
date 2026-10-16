import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../auth.jsx';

// Menu shared by every page of the logged-in area
export default function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <nav aria-label="Navigation principale">
        <NavLink to="/dashboard">Tableau de bord</NavLink> · <NavLink to="/transactions">Transactions</NavLink> ·{' '}
        <NavLink to="/transactions/new" end>
          Ajouter une dépense
        </NavLink>{' '}
        · <Link to="/transactions/new?type=INCOME">Ajouter un revenu</Link> ·{' '}
        <button type="button" onClick={handleLogout}>
          Se déconnecter
        </button>
      </nav>
      <hr />
      <Outlet />
    </>
  );
}
