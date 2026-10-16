import { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Shows a recovery code once; the user must confirm they saved it before continuing
export default function RecoveryCode({ code, onDone }) {
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
  };

  const download = () => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([t('recoveryCode.fileText', { code })], { type: 'text/plain' }));
    link.download = t('recoveryCode.fileName');
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <section aria-labelledby="recovery-title">
      <h2 id="recovery-title">{t('recoveryCode.title')}</h2>
      <p>
        {t('recoveryCode.intro1')} <strong>{t('recoveryCode.onlyWay')}</strong> {t('recoveryCode.intro2')}
      </p>
      <p>
        <code style={{ fontSize: '1.4em' }}>{code}</code>
      </p>
      <p>
        <button type="button" onClick={copy}>
          {copied ? t('recoveryCode.copied') : t('recoveryCode.copy')}
        </button>{' '}
        <button type="button" onClick={download}>
          {t('recoveryCode.download')}
        </button>
      </p>
      <p>
        <input id="saved" type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />{' '}
        <label htmlFor="saved">{t('recoveryCode.saved')}</label>
      </p>
      <button type="button" disabled={!saved} onClick={onDone}>
        {t('recoveryCode.continue')}
      </button>
    </section>
  );
}
