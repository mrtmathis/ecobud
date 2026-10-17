import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Logo from './Logo.jsx';

// Shown when the app opens without internet: the figures live on the server, so nothing can be shown yet
export default function Offline() {
  const { t } = useTranslation();

  // Comes back by itself as soon as the connection returns
  useEffect(() => {
    const retry = () => window.location.reload();
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, []);

  return (
    <div className="guest">
      <main className="offline">
        <Logo size={56} />
        <h1>{t('offline.title')}</h1>
        <p>{t('offline.text')}</p>
        <button type="button" className="primary" onClick={() => window.location.reload()}>
          {t('pageError.retry')}
        </button>
      </main>
    </div>
  );
}
