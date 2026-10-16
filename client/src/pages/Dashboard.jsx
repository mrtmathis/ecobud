import { useState } from 'react';
import { Link } from 'react-router';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { errorMessage } from '../messages.js';
import PasswordInput from '../components/PasswordInput.jsx';
import RecoveryCode from '../components/RecoveryCode.jsx';

// Placeholder until the budget features arrive in the next steps
export default function Dashboard() {
  const { user, signIn } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [newCode, setNewCode] = useState(null);

  const regenerate = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const data = await api('/auth/recovery-code', { method: 'POST', body: { password } });
      setPassword('');
      setNewCode(data);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (newCode) {
    return (
      <main>
        <RecoveryCode
          code={newCode.recoveryCode}
          onDone={() => {
            signIn(newCode.user);
            setNewCode(null);
          }}
        />
      </main>
    );
  }

  return (
    <main>
      <h1>Bonjour {user.name}</h1>
      <p>Tu es connecté avec {user.email}.</p>
      <p>
        <Link to="/transactions/new">Ajouter une dépense</Link> ·{' '}
        <Link to="/transactions/new?type=INCOME">Ajouter un revenu (salaire, virement…)</Link> ·{' '}
        <Link to="/transactions">Voir mes transactions</Link>
      </p>
      <p>Le budget et le résumé du mois arrivent à la prochaine étape.</p>

      <section aria-labelledby="recovery-section">
        <h2 id="recovery-section">Code de récupération</h2>
        {user.hasRecoveryCode ? (
          <p>Tu as un code de récupération. Si tu l’as perdu, génère-en un nouveau : l’ancien ne marchera plus.</p>
        ) : (
          <p role="alert">Tu n’as pas encore de code de récupération. Sans lui, un mot de passe oublié est définitif.</p>
        )}
        <form onSubmit={regenerate}>
          <label htmlFor="current-password">Confirme ton mot de passe</label>
          <br />
          <PasswordInput
            id="current-password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />{' '}
          <button type="submit">{user.hasRecoveryCode ? 'Générer un nouveau code' : 'Générer mon code'}</button>
        </form>
        {error && <p role="alert">{error}</p>}
      </section>
    </main>
  );
}
