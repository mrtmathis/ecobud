import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../auth.jsx';
import { errorMessage } from '../messages.js';
import PasswordInput from '../components/PasswordInput.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(errorMessage(err));
      setSending(false);
    }
  };

  return (
    <main>
      <h1>Se connecter</h1>
      <form onSubmit={submit}>
        <p>
          <label htmlFor="email">Adresse e-mail</label>
          <br />
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </p>
        <p>
          <label htmlFor="password">Mot de passe</label>
          <br />
          <PasswordInput
            id="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </p>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={sending}>
          {sending ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
      <p>
        <Link to="/forgot-password">Mot de passe oublié ?</Link>
      </p>
      <p>
        Pas encore de compte ? <Link to="/register">Créer un compte</Link>
      </p>
    </main>
  );
}
