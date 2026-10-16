import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api } from '../api.js';
import { PASSWORD_RULES, errorMessage, isStrongPassword } from '../messages.js';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!isStrongPassword(password)) return setError(`Mot de passe trop faible : ${PASSWORD_RULES}`);
    setSending(true);
    setError('');
    try {
      await api('/auth/reset-password', { method: 'POST', body: { token: params.get('token') || '', password } });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    }
    setSending(false);
  };

  if (done) {
    return (
      <main>
        <h1>Mot de passe modifié</h1>
        <p role="status">Ton mot de passe a été changé. Tes autres sessions ont été déconnectées.</p>
        <p>
          <Link to="/login">Se connecter</Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Nouveau mot de passe</h1>
      <form onSubmit={submit}>
        <p>
          <label htmlFor="password">Nouveau mot de passe</label>
          <br />
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-describedby="password-rules"
            minLength={12}
            maxLength={128}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <br />
          <small id="password-rules">{PASSWORD_RULES}</small>
        </p>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={sending}>
          {sending ? 'Enregistrement…' : 'Changer mon mot de passe'}
        </button>
      </form>
    </main>
  );
}
