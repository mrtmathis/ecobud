import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { formatCents, locale } from '../format.js';
import { errorMessage } from '../messages.js';
import { isAndroid, isIos } from '../pwa.js';
import Icon from '../components/Icon.jsx';

const euros = (amount) => formatCents(Math.round(amount * 100));
const date = (value) => new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString(locale());

// Same data as a JSON file, for people who want to import it into another program
function downloadJson(data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `ecobud-${data.exportedAt.slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

// Everything EcoBud keeps about the user, as a readable page that the browser can save as a PDF
export default function DataReport() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/account/export')
      .then(setData)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p>{t('common.loading')}</p>;

  const { account, settings } = data;
  const category = (id) => t(`categories.${id}`);
  const days = settings.reminder.days.length === 7 ? t('report.everyDay') : settings.reminder.days.map((d) => t(`report.weekdays.${d}`)).join(', ');

  return (
    <main className="report">
      <div className="page-head no-print">
        <h1>{t('account.dataTitle')}</h1>
        <p>{t('report.intro')}</p>
        <div className="form-actions">
          <button type="button" className="primary" onClick={() => window.print()}>
            <Icon name="download" size={18} /> {t('report.savePdf')}
          </button>
          <Link to="/account">{t('report.back')}</Link>
        </div>
        <div className="pdf-help">
          <p>
            <strong>{t('report.pdfWarning')}</strong>
          </p>
          {/* Only the steps of the device in use, the print windows differ a lot */}
          <ol>
            {t(`report.pdfSteps.${isIos() ? 'ios' : isAndroid() ? 'android' : 'computer'}`, { returnObjects: true }).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </div>

      <header className="report-head">
        <h1>{t('report.title')}</h1>
        <p>{t('report.exportedAt', { date: date(data.exportedAt) })}</p>
      </header>

      <section>
        <h2>{t('report.account')}</h2>
        <dl className="report-list">
          <dt>{t('auth.name')}</dt>
          <dd>{account.name}</dd>
          <dt>{t('auth.email')}</dt>
          <dd>{account.email}</dd>
          <dt>{t('report.createdAt')}</dt>
          <dd>{date(account.createdAt)}</dd>
          <dt>{t('report.lastActive')}</dt>
          <dd>{date(account.lastActiveAt)}</dd>
        </dl>
      </section>

      <section>
        <h2>{t('report.settings')}</h2>
        <dl className="report-list">
          <dt>{t('account.language')}</dt>
          <dd>{settings.language === 'en' ? 'English' : 'Français'}</dd>
          <dt>{t('report.timezone')}</dt>
          <dd>{settings.timezone}</dd>
          <dt>{t('theme.skinLabel')}</dt>
          <dd>
            {t(`theme.skins.${settings.theme}.name`)} · {t(`theme.modes.${settings.appearance}`)}
          </dd>
          <dt>{t('report.reminder')}</dt>
          <dd>{settings.reminder.on ? `${settings.reminder.time}, ${days}` : t('report.off')}</dd>
          <dt>{t('report.alerts')}</dt>
          <dd>{settings.budgetAlerts ? t('report.on') : t('report.off')}</dd>
        </dl>
      </section>

      <section>
        <h2>
          {t('report.transactions')} ({data.transactions.length})
        </h2>
        {data.transactions.length === 0 ? (
          <p className="empty">{t('report.none')}</p>
        ) : (
          <div className="report-table">
            <table>
              <thead>
                <tr>
                  <th>{t('transactionForm.date')}</th>
                  <th>{t('common.type')}</th>
                  <th>{t('common.category')}</th>
                  <th>{t('report.note')}</th>
                  <th className="num">{t('report.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((tr, i) => (
                  <tr key={i}>
                    <td>{date(tr.date)}</td>
                    <td>{tr.type === 'EXPENSE' ? t('common.expense') : t('common.income')}</td>
                    <td>{category(tr.category)}</td>
                    <td>{tr.note}</td>
                    <td className="num">{euros(tr.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2>
          {t('report.recurrences')} ({data.recurrences.length})
        </h2>
        {data.recurrences.length === 0 ? (
          <p className="empty">{t('report.none')}</p>
        ) : (
          <div className="report-table">
            <table>
              <thead>
                <tr>
                  <th>{t('recurrenceForm.name')}</th>
                  <th>{t('common.type')}</th>
                  <th>{t('common.category')}</th>
                  <th>{t('report.frequency')}</th>
                  <th>{t('report.next')}</th>
                  <th className="num">{t('report.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {data.recurrences.map((r, i) => (
                  <tr key={i}>
                    <td>{r.label}</td>
                    <td>{r.type === 'EXPENSE' ? t('common.expense') : t('common.income')}</td>
                    <td>{category(r.category)}</td>
                    <td>{t(`frequency.${r.frequency}`)}</td>
                    <td>{date(r.nextDate)}</td>
                    <td className="num">{euros(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2>{t('report.budgets')}</h2>
        {data.budgets.length === 0 ? (
          <p className="empty">{t('report.none')}</p>
        ) : (
          <ul className="report-plain">
            {data.budgets.map((b) => (
              <li key={b.month}>
                {new Date(`${b.month}-15T12:00:00`).toLocaleDateString(locale(), { month: 'long', year: 'numeric' })} :{' '}
                {euros(b.amount)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>{t('report.other')}</h2>
        <ul className="report-plain">
          <li>{t('report.recapAnswers', { count: data.recapAnswers.length })}</li>
          <li>{t('report.nothingDays', { count: data.nothingSpentDays.length })}</li>
          <li>{t('report.devices', { count: data.notificationDevices.length })}</li>
        </ul>
      </section>

      <p className="legal-links no-print">
        {t('report.jsonHint')}{' '}
        <button type="button" className="link-button" onClick={() => downloadJson(data)}>
          {t('report.jsonLink')}
        </button>
      </p>
    </main>
  );
}
