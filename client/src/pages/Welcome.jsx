import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { centsToInput, formatCents, parseAmount } from '../format.js';
import { errorMessage } from '../messages.js';
import { applyTheme } from '../theme.js';
import InstallApp from '../components/InstallApp.jsx';
import NotificationSettings from '../components/NotificationSettings.jsx';
import QuickRecurrences from '../components/QuickRecurrences.jsx';
import ThemePicker from '../components/ThemePicker.jsx';

const STEPS = ['theme', 'income', 'fixed', 'budget', 'reminders'];

// First-login guide: theme, regular income, fixed expenses, budget, then reminders; every step can be skipped
export default function Welcome() {
  const { user, signIn } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  const next = () => {
    setError('');
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };

  // Marks the guide as done, so it is not shown again
  const finish = async () => {
    try {
      const data = await api('/settings/onboarding', { method: 'PUT', body: { done: true } });
      signIn(data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const name = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <main className="onboarding">
      <div className="onboarding-head">
        <p className="onboarding-count">{t('onboarding.count', { step: step + 1, total: STEPS.length })}</p>
        <button type="button" className="link-button" onClick={finish}>
          {t('onboarding.skipAll')}
        </button>
      </div>
      <div className="onboarding-bar" aria-hidden="true">
        {STEPS.map((s, i) => (
          <i key={s} className={i <= step ? 'is-done' : undefined} />
        ))}
      </div>

      {name === 'theme' && <ThemeStep user={user} signIn={signIn} onDone={next} setError={setError} />}
      {name === 'income' && <RecurrenceStep type="INCOME" />}
      {name === 'fixed' && <RecurrenceStep type="EXPENSE" />}
      {name === 'budget' && <BudgetStep onDone={next} setError={setError} />}
      {name === 'reminders' && (
        <>
          <div>
            <h1>{t('onboarding.remindersTitle')}</h1>
            <p>{t('onboarding.remindersIntro')}</p>
          </div>
          {/* iPhones only allow notifications once the app is installed */}
          <InstallApp />
          <NotificationSettings />
        </>
      )}

      {error && <p role="alert">{error}</p>}
      {name !== 'theme' && name !== 'budget' && (
        <div className="form-actions">
          <button type="button" className="primary" onClick={last ? finish : next}>
            {last ? t('onboarding.finish') : t('onboarding.next')}
          </button>
          {step > 0 && (
            <button type="button" className="link-button" onClick={() => setStep((s) => s - 1)}>
              {t('onboarding.back')}
            </button>
          )}
        </div>
      )}
    </main>
  );
}

// Step 1: the user picks the look of the app, previewed on the whole page
function ThemeStep({ user, signIn, onDone, setError }) {
  const { t } = useTranslation();
  const [theme, setTheme] = useState({ skin: user.skin, appearance: user.appearance });
  const [sending, setSending] = useState(false);

  const change = (value) => {
    setTheme(value);
    applyTheme(value);
  };

  const save = async () => {
    setSending(true);
    try {
      const data = await api('/settings/theme', { method: 'PUT', body: theme });
      signIn(data.user);
      onDone();
    } catch (err) {
      setError(errorMessage(err));
      setSending(false);
    }
  };

  return (
    <>
      <div>
        <h1>{t('theme.welcomeTitle', { name: user.name })}</h1>
        <p>{t('theme.welcomeIntro')}</p>
      </div>
      <ThemePicker value={theme} onChange={change} />
      <div className="form-actions">
        <button type="button" className="primary" onClick={save} disabled={sending}>
          {t('onboarding.next')}
        </button>
      </div>
    </>
  );
}

// Steps 2 and 3: regular income, then fixed expenses, saved as recurrences
function RecurrenceStep({ type }) {
  const { t } = useTranslation();
  const key = type === 'INCOME' ? 'income' : 'fixed';
  return (
    <>
      <div>
        <h1>{t(`onboarding.${key}Title`)}</h1>
        <p>{t(`onboarding.${key}Intro`)}</p>
      </div>
      <QuickRecurrences type={type} />
    </>
  );
}

// Step 4: the budget, suggested from the expected income of the month
function BudgetStep({ onDone, setError }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api('/budgets')
      .then((result) => {
        setData(result);
        const cents = result.budget?.amountCents || result.plan.incomeCents;
        setAmount(cents ? centsToInput(cents) : '');
      })
      .catch((err) => setError(errorMessage(err)));
  }, [setError]);

  const save = async (event) => {
    event.preventDefault();
    const amountCents = parseAmount(amount);
    if (!amountCents) return setError(t('common.invalidAmount'));
    setSending(true);
    try {
      await api('/budgets', { method: 'PUT', body: { month: data.month, amountCents } });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
      setSending(false);
    }
  };

  return (
    <>
      <div>
        <h1>{t('onboarding.budgetTitle')}</h1>
        <p>{t('budget.intro')}</p>
      </div>
      {data && (
        <form onSubmit={save} className="form-grid">
          {data.plan.incomeCents > 0 && (
            <p>
              {t('budget.planIncome', { amount: formatCents(data.plan.incomeCents) })}
              {data.plan.recurringExpenseCents > 0 && (
                <>
                  {' '}
                  {t('budget.planRecurring', { amount: formatCents(data.plan.recurringExpenseCents) })}
                </>
              )}
            </p>
          )}
          <div className="field">
            <label htmlFor="budget-amount">{t('budget.label')}</label>
            <div className="amount-field">
              <input
                id="budget-amount"
                inputMode="decimal"
                placeholder={t('budget.placeholder')}
                autoComplete="off"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <span aria-hidden="true">€</span>
            </div>
            <small>{t('budget.carriesOver')}</small>
          </div>
          <div className="form-actions">
            <button type="submit" className="primary" disabled={sending}>
              {t('onboarding.saveNext')}
            </button>
            <button type="button" className="link-button" onClick={onDone}>
              {t('onboarding.skip')}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
