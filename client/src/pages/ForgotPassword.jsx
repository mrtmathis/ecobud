import { useState } from 'react';
import { Link } from 'react-router';
import { api } from '../api.js';
import { errorMessage } from '../messages.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError('');
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email } });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    }
    setSending(false);
  };

  return (
    <main>
      <h1>Mot de passe oublié</h1>
      {sent ? (
        <p role="status">
          Si un compte existe avec cette adresse, un e-mail vient d’être envoyé. Le lien est valable 30 minutes.
        </p>
      ) : (
        <form onSubmit={submit}>
          <p>
            <label htmlFor="email">Adresse e-mail du compte</label>
            <br />
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </p>
          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={sending}>
            {sending ? 'Envoi…' : 'Recevoir un lien'}
          </button>
        </form>
      )}
      <p>
        <Link to="/login">Retour à la connexion</Link>
      </p>
    </main>
  );
}
