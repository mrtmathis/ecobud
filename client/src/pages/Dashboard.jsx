import { useNavigate } from 'react-router';
import { useAuth } from '../auth.jsx';

// Placeholder until the budget features arrive in the next steps
export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <main>
      <h1>Bonjour {user.name}</h1>
      <p>Tu es connecté avec {user.email}.</p>
      <p>Les dépenses et le budget arrivent à la prochaine étape.</p>
      <button type="button" onClick={handleLogout}>
        Se déconnecter
      </button>
    </main>
  );
}
