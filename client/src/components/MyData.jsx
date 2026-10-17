import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { errorMessage } from '../messages.js';
import { ApiError } from '../api.js';
import Icon from './Icon.jsx';

// My account: download everything the app keeps about the user, and the legal pages
export default function MyData() {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  // The file is fetched with the session cookie, then saved by the browser
  const download = async () => {
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/account/export');
      if (!res.ok) throw new ApiError(res.status, 'SERVER_ERROR');
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `ecobud-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(errorMessage(err));
    }
    setSending(false);
  };

  return (
    <section aria-labelledby="data-section">
      <h2 id="data-section">{t('account.dataTitle')}</h2>
      <p>{t('account.dataHint')}</p>
      <button type="button" onClick={download} disabled={sending}>
        <Icon name="download" size={18} /> {t('account.dataDownload')}
      </button>
      {error && <p role="alert">{error}</p>}
      <p className="legal-links">
        <Link to="/privacy">{t('legal.privacyTitle')}</Link> · <Link to="/legal">{t('legal.legalTitle')}</Link>
      </p>
    </section>
  );
}
