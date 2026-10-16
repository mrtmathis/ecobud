import { useTranslation } from 'react-i18next';
import { isIos, isStandalone, useInstallPrompt } from '../pwa.js';

// Install button where the browser offers one, step by step instructions on iPhone
export default function InstallApp() {
  const { t } = useTranslation();
  const { canInstall, install } = useInstallPrompt();

  let content;
  if (isStandalone()) {
    content = <p>{t('install.installed')}</p>;
  } else if (canInstall) {
    content = (
      <p>
        {t('install.intro')}{' '}
        <button type="button" onClick={install}>
          {t('install.button')}
        </button>
      </p>
    );
  } else if (isIos()) {
    content = (
      <>
        <p>{t('install.iosIntro')}</p>
        <ol>
          <li>{t('install.iosStep1')}</li>
          <li>{t('install.iosStep2')}</li>
          <li>{t('install.iosStep3')}</li>
        </ol>
      </>
    );
  } else {
    content = <p>{t('install.browserMenu')}</p>;
  }

  return (
    <section aria-labelledby="install-title">
      <h2 id="install-title">{t('install.title')}</h2>
      {content}
    </section>
  );
}
