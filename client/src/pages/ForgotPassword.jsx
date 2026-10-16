import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { errorMessage, isStrongPassword } from '../messages.js';
import PasswordInput from '../components/PasswordInput.jsx';
import RecoveryCode from '../components/RecoveryCode.jsx';

export default function ForgotPassword() {
  const { signIn } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', recoveryCode: '', password: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    if (!isStrongPassword(form.password)) return setError(t('password.tooWeak', { rules: t('password.rules') }));
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
        <h1>{t('forgot.doneTitle')}</h1>
        <p role="status">{t('forgot.doneStatus')}</p>
        <p>{t('forgot.newCode')}</p>
        <RecoveryCode code={result.recoveryCode} onDone={finish} />
      </main>
    );
  }

  return (
    <main>
      <h1>{t('forgot.title')}</h1>
      <p>{t('forgot.intro')}</p>
      <form onSubmit={submit}>
        <p>
          <label htmlFor="email">{t('forgot.email')}</label>
          <br />
          <input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={update} />
        </p>
        <p>
          <label htmlFor="recoveryCode">{t('forgot.code')}</label>
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
          <label htmlFor="password">{t('forgot.newPassword')}</label>
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
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={sending}>
          {sending ? t('forgot.checking') : t('forgot.submit')}
        </button>
      </form>
      <p>{t('forgot.lost')}</p>
      <p>
        <Link to="/login">{t('forgot.back')}</Link>
      </p>
    </main>
  );
}
