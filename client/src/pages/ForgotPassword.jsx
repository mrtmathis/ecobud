import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { PASSWORD_RULES, errorMessage, isStrongPassword } from '../messages.js';
import PasswordInput from '../components/PasswordInput.jsx';
import RecoveryCode from '../components/RecoveryCode.jsx';

export default function ForgotPassword() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', recoveryCode: '', password: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    if (!isStrongPassword(form.password)) return setError(`Mot de passe trop faible : ${PASSWORD_RULES}`);
    setSending(true);
    setError('');
    try {
      setResult(await api('/auth/recover', { method: 'POST', body: form }));
    } catch (err) {
      setError(errorMessage(err));
      setSending(false);
    }
  };

  // Password changed: the old code is used up, so a new one is shown
  if (result) {
    const finish = () => {
      signIn(result.user);
      navigate('/dashboard');
    };
    return (
      <main>
        <h1>Mot de passe modifié</h1>
        <p role="status">Ton mot de passe a été changé et tes autres sessions ont été déconnectées.</p>
        <p>Ton ancien code de récupération ne fonctionne plus. Voici le nouveau.</p>
        <RecoveryCode code={result.recoveryCode} onDone={finish} />
      </main>
    );
  }

  return (
    <main>
      <h1>Mot de passe oublié</h1>
      <p>Saisis ton code de récupération, reçu à la création de ton compte, pour choisir un nouveau mot de passe.</p>
      <form onSubmit={submit}>
        <p>
          <label htmlFor="email">Adresse e-mail du compte</label>
          <br />
          <input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={update} />
        </p>
        <p>
          <label htmlFor="recoveryCode">Code de récupération</label>
          <br />
          <input
            id="recoveryCode"
            name="recoveryCode"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            maxLength={40}
            required
            value={form.recoveryCode}
            onChange={update}
          />
        </p>
        <p>
          <label htmlFor="password">Nouveau mot de passe</label>
          <br />
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            aria-describedby="password-rules"
            minLength={12}
            maxLength={128}
            required
            value={form.password}
            onChange={update}
          />
          <br />
          <small id="password-rules">{PASSWORD_RULES}</small>
        </p>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={sending}>
          {sending ? 'Vérification…' : 'Changer mon mot de passe'}
        </button>
      </form>
      <p>
        Code perdu ? Sans lui, le compte ne peut pas être récupéré : tu peux en créer un nouveau.
      </p>
      <p>
        <Link to="/login">Retour à la connexion</Link>
      </p>
    </main>
  );
}
