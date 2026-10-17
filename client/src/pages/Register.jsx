import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { errorMessage, isStrongPassword } from '../messages.js';
import PasswordInput from '../components/PasswordInput.jsx';
import RecoveryCode from '../components/RecoveryCode.jsx';

export default function Register() {
  const { signIn } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [created, setCreated] = useState(null);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    if (!isStrongPassword(form.password)) return setError(t('password.tooWeak', { rules: t('password.rules') }));
    setSending(true);
    setError('');
    try {
      // The account keeps the language shown while signing up
      setCreated(await api('/auth/register', { method: 'POST', body: { ...form, language: i18n.language } }));
    } catch (err) {
      setError(errorMessage(err));
      setSending(false);
    }
  };

  // Account created: show the recovery code before entering the app
  if (created) {
    const finish = () => {
      signIn(created.user);
      navigate('/dashboard');
    };
    return (
      <main>
        <h1>{t('auth.created')}</h1>
        <RecoveryCode code={created.recoveryCode} onDone={finish} />
      </main>
    );
  }

  return (
    <main>
      <h1>{t('auth.register')}</h1>
      <form onSubmit={submit}>
        <p>
          <label htmlFor="name">{t('auth.name')}</label>
          <br />
          <input id="name" name="name" autoComplete="given-name" maxLength={60} required value={form.name} onChange={update} />
        </p>
        <p>
          <label htmlFor="email">{t('auth.email')}</label>
          <br />
          <input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={update} />
        </p>
        <p>
          <label htmlFor="password">{t('auth.password')}</label>
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
          <small id="password-rules">{t('password.rules')}</small>
        </p>
        <p className="legal-links">
          {t('auth.privacyNotice')} <Link to="/privacy">{t('legal.privacyTitle')}</Link>
        </p>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={sending}>
          {sending ? t('auth.creating') : t('auth.createMine')}
        </button>
      </form>
      <p>
        {t('auth.hasAccount')} <Link to="/login">{t('auth.login')}</Link>
      </p>
    </main>
  );
}
