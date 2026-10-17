import { Component } from 'react';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';

const RELOADED = 'ecobud_reloaded';

// A page file missing because a new version went online: reload once to get the new files
function isMissingFile(error) {
  return /dynamically imported module|Importing a module script failed|error loading dynamically/i.test(error?.message || '');
}

// Catches a page that cannot be drawn, instead of leaving a blank screen
class Boundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    let reloaded = false;
    try {
      reloaded = sessionStorage.getItem(RELOADED) === '1';
      if (!reloaded && navigator.onLine && isMissingFile(error)) {
        sessionStorage.setItem(RELOADED, '1');
        window.location.reload();
      }
    } catch {
      // Storage blocked: the message below still lets the user retry
    }
  }

  render() {
    return this.state.error ? <ErrorScreen /> : this.props.children;
  }
}

function ErrorScreen() {
  const { t } = useTranslation();
  return (
    <main className="page-error">
      <h1>{t('pageError.title')}</h1>
      <p>{navigator.onLine ? t('pageError.update') : t('pageError.offline')}</p>
      <div className="form-actions">
        <button type="button" className="primary" onClick={() => window.location.reload()}>
          {t('pageError.retry')}
        </button>
        <a href="/">{t('notFound.back')}</a>
      </div>
    </main>
  );
}

// A fresh boundary for each page, so leaving a broken page clears the message
export default function PageError({ children }) {
  const { pathname } = useLocation();
  return <Boundary key={pathname}>{children}</Boundary>;
}

// Once the app has loaded fine, a later missing file may reload again
export function clearReloadFlag() {
  try {
    sessionStorage.removeItem(RELOADED);
  } catch {
    // Nothing to clear
  }
}
