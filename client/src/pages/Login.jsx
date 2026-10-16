import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth.jsx';
import { errorMessage } from '../messages.js';
import PasswordInput from '../components/PasswordInput.jsx';

export default function Login() {
  const { login } = useAuth();
  const { t } = useTranslation();
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
      <h1>{t('auth.login')}</h1>
      <form onSubmit={submit}>
        <p>
          <label htmlFor="email">{t('auth.email')}</label>
          <br />
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </p>
        <p>
          <label htmlFor="password">{t('auth.password')}</label>
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
          {sending ? t('auth.loggingIn') : t('auth.login')}
        </button>
      </form>
      <p>
        <Link to="/forgot-password">{t('auth.forgot')}</Link>
      </p>
      <p>
        {t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link>
      </p>
    </main>
  );
}
