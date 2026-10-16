import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../auth.jsx';
import { PASSWORD_RULES, errorMessage, isStrongPassword } from '../messages.js';
import PasswordInput from '../components/PasswordInput.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    if (!isStrongPassword(form.password)) return setError(`Mot de passe trop faible : ${PASSWORD_RULES}`);
    setSending(true);
    setError('');
    try {
      const language = navigator.language.startsWith('fr') ? 'fr' : 'en';
      await register({ ...form, language });
      navigate('/dashboard');
    } catch (err) {
      setError(errorMessage(err));
      setSending(false);
    }
  };

  return (
    <main>
      <h1>Créer un compte</h1>
      <form onSubmit={submit}>
        <p>
          <label htmlFor="name">Prénom</label>
          <br />
          <input id="name" name="name" autoComplete="given-name" maxLength={60} required value={form.name} onChange={update} />
        </p>
        <p>
          <label htmlFor="email">Adresse e-mail</label>
          <br />
          <input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={update} />
        </p>
        <p>
          <label htmlFor="password">Mot de passe</label>
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
          {sending ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
      <p>
        Déjà un compte ? <Link to="/login">Se connecter</Link>
      </p>
    </main>
  );
}
