import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { locale } from '../format.js';
import { errorMessage } from '../messages.js';
import { currentSubscription, disablePush, enablePush, isIos, isStandalone, pushSupported } from '../pwa.js';

const pad = (n) => String(n).padStart(2, '0');
// 00:00, 00:15 ... 23:45, the steps of the notification job
const TIMES = Array.from({ length: 96 }, (_, i) => `${pad(Math.floor(i / 4))}:${pad((i % 4) * 15)}`);
const DAYS = [1, 2, 3, 4, 5, 6, 7];

// Monday 1 January 2024 is used to get the weekday names in the current language
const dayName = (day) => new Date(2024, 0, day).toLocaleDateString(locale(), { weekday: 'long' });

// What this browser can do with notifications right now
async function deviceState() {
  if (!pushSupported()) return isIos() && !isStandalone() ? 'installFirst' : 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  return (await currentSubscription()) ? 'on' : 'off';
}

export default function NotificationSettings() {
  const { t } = useTranslation();
  const [device, setDevice] = useState('loading');
  const [settings, setSettings] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    deviceState().then(setDevice);
    api('/settings')
      .then((data) => setSettings(data.settings))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  // Runs an action and shows its result or its error
  const run = async (action, success) => {
    setMessage('');
    setError('');
    try {
      await action();
      if (success) setMessage(success);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const enable = () =>
    run(async () => {
      const granted = await enablePush();
      setDevice(granted ? 'on' : await deviceState());
    });

  const disable = () =>
    run(async () => {
      await disablePush();
      setDevice('off');
    });

  const test = () => run(() => api('/push/test', { method: 'POST' }), t('notifications.testSent'));

  const update = (name, value) => setSettings((s) => ({ ...s, [name]: value }));

  const toggleDay = (day) =>
    update('reminderDays', settings.reminderDays.includes(day) ? settings.reminderDays.filter((d) => d !== day) : [...settings.reminderDays, day]);

  const saveReminder = (event) => {
    event.preventDefault();
    const { reminderOn, reminderTime, reminderDays } = settings;
    run(async () => {
      const data = await api('/settings/reminder', { method: 'PUT', body: { reminderOn, reminderTime, reminderDays } });
      setSettings(data.settings);
    }, t('notifications.reminderSaved'));
  };

  const toggleAlerts = (alertsOn) =>
    run(async () => {
      const data = await api('/settings/alerts', { method: 'PUT', body: { alertsOn } });
      setSettings(data.settings);
    }, alertsOn ? t('notifications.alertsOn') : t('notifications.alertsOff'));

  return (
    <section aria-labelledby="notifications-title">
      <h2 id="notifications-title">{t('notifications.title')}</h2>

      <h3>{t('notifications.deviceTitle')}</h3>
      {device === 'loading' && <p>{t('common.loading')}</p>}
      {device === 'installFirst' && <p>{t('notifications.installFirst')}</p>}
      {device === 'unsupported' && <p>{t('notifications.unsupported')}</p>}
      {device === 'denied' && <p>{t('notifications.denied')}</p>}
      {device === 'off' && (
        <p>
          {t('notifications.off')}{' '}
          <button type="button" onClick={enable}>
            {t('notifications.enable')}
          </button>
        </p>
      )}
      {device === 'on' && (
        <p>
          {t('notifications.on')}{' '}
          <button type="button" onClick={test}>
            {t('notifications.test')}
          </button>{' '}
          <button type="button" onClick={disable}>
            {t('notifications.disable')}
          </button>
        </p>
      )}

      {settings && (
        <>
          <form onSubmit={saveReminder}>
            <h3>{t('notifications.reminderTitle')}</h3>
            <p>{t('notifications.reminderIntro')}</p>
            <p>
              <label>
                <input type="checkbox" checked={settings.reminderOn} onChange={(e) => update('reminderOn', e.target.checked)} />{' '}
                {t('notifications.reminderOn')}
              </label>
            </p>
            <p>
              <label htmlFor="reminderTime">{t('notifications.time')}</label>{' '}
              <select
                id="reminderTime"
                disabled={!settings.reminderOn}
                value={settings.reminderTime}
                onChange={(e) => update('reminderTime', e.target.value)}
              >
                {TIMES.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </p>
            <fieldset disabled={!settings.reminderOn}>
              <legend>{t('notifications.days')}</legend>
              {DAYS.map((day) => (
                <label key={day}>
                  <input type="checkbox" checked={settings.reminderDays.includes(day)} onChange={() => toggleDay(day)} />{' '}
                  {dayName(day)}{' '}
                </label>
              ))}
            </fieldset>
            <button type="submit">{t('common.save')}</button>
          </form>

          <h3>{t('notifications.alertsTitle')}</h3>
          <p>
            <label>
              <input type="checkbox" checked={settings.alertsOn} onChange={(e) => toggleAlerts(e.target.checked)} />{' '}
              {t('notifications.alertsLabel')}
            </label>
          </p>
        </>
      )}

      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
