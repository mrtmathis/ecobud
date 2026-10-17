import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { formatCents, formatMonth } from '../format.js';

const SEGMENTS = 20;

// "Left to spend": same figures in every theme, each theme draws them its own way
export default function BudgetHero({ data, skin }) {
  const { t } = useTranslation();

  if (data.budgetCents === null) {
    return (
      <section className="hero hero-empty card" aria-labelledby="hero-title">
        <h2 id="hero-title">{t('dashboard.remainingTitle')}</h2>
        <p>{t('dashboard.noBudget')}</p>
        <p className="empty">{t('dashboard.budgetHint')}</p>
        <Link to="/budget" className="btn">
          {t('dashboard.setBudget')}
        </Link>
      </section>
    );
  }

  const percent = data.percentUsed;
  const figures = {
    label: t('dashboard.remainingTitle'),
    remaining: formatCents(data.remainingCents),
    spent: formatCents(data.spentCents),
    budget: formatCents(data.budgetCents),
    percent,
    // Stamp or sticker: the usage, or a warning once an alert level is reached
    badge:
      data.alertLevel === 100
        ? t('dashboard.stampOver')
        : data.alertLevel === 80
          ? t('dashboard.stampWarning')
          : t('dashboard.used', { percent }),
    level: data.alertLevel ?? 0,
  };

  if (skin === 'bocal') return <JarHero {...figures} />;
  if (skin === 'pop') return <PopHero {...figures} />;
  return <TicketHero {...figures} month={formatMonth(data.month)} />;
}

function Details({ spent, budget }) {
  const { t } = useTranslation();
  return <p className="hero-sub tnum">{t('dashboard.spentOfBudgetShort', { spent, budget })}</p>;
}

// Ticket: a receipt that prints, a highlighter on the amount and a stamp
function TicketHero({ label, remaining, spent, budget, percent, badge, level, month }) {
  const { t } = useTranslation();
  const filled = Math.min(Math.round((percent / 100) * SEGMENTS), SEGMENTS);
  return (
    <section className="hero hero-ticket" aria-labelledby="hero-title">
      <div className="receipt">
        <div className="receipt-head">
          <span className="receipt-shop">EcoBud</span>
          <span className="receipt-meta">{month}</span>
        </div>
        <span className="stamp" data-level={level}>
          {badge}
        </span>
        <h2 id="hero-title" className="hero-label">
          {label}
        </h2>
        <p className="hero-amount tnum">
          <mark>{remaining}</mark>
        </p>
        <div className="segments" aria-hidden="true">
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <i key={i} className={i < filled ? 'on' : undefined} style={{ animationDelay: `${300 + i * 30}ms` }} />
          ))}
        </div>
        <div className="receipt-row tnum">
          <span>{t('dashboard.spentLabel')}</span>
          <span className="dots" />
          <span>{spent}</span>
        </div>
        <div className="receipt-row tnum">
          <span>{t('dashboard.budgetLabel')}</span>
          <span className="dots" />
          <span>{budget}</span>
        </div>
        <div className="barcode" aria-hidden="true" />
      </div>
    </section>
  );
}

// Jar: the water level is what is left of the budget
function JarHero({ label, remaining, spent, budget, percent, badge, level }) {
  const left = Math.max(0, Math.min(100, 100 - percent));
  return (
    <section className="hero hero-jar" aria-labelledby="hero-title" data-level={level}>
      <div className="jar" aria-hidden="true">
        <span className="jar-shine" />
        <div className="jar-water" style={{ '--level': `${left}%` }}>
          <svg className="jar-wave" viewBox="0 0 200 16" preserveAspectRatio="none">
            <path d="M0 8 Q12.5 0 25 8 T50 8 T75 8 T100 8 T125 8 T150 8 T175 8 T200 8 V16 H0Z" />
          </svg>
          <span className="bubble" />
          <span className="bubble" />
          <span className="bubble" />
        </div>
      </div>
      <div className="jar-text">
        <h2 id="hero-title" className="hero-label">
          {label}
        </h2>
        <p className="hero-amount tnum">{remaining}</p>
        <Details spent={spent} budget={budget} />
        <span className="pill" data-level={level}>
          <i aria-hidden="true" />
          {badge}
        </span>
      </div>
    </section>
  );
}

// Pop: a bold block, a striped gauge and a sticker that wiggles
function PopHero({ label, remaining, spent, budget, percent, badge, level }) {
  return (
    <section className="hero hero-pop" aria-labelledby="hero-title" data-level={level}>
      <span className="sticker" data-level={level}>
        {badge}
      </span>
      <h2 id="hero-title" className="hero-label">
        {label}
      </h2>
      <p className="hero-amount tnum">{remaining}</p>
      <div className="gauge" aria-hidden="true">
        <i style={{ '--used': `${Math.min(percent, 100)}%` }} />
      </div>
      <Details spent={spent} budget={budget} />
    </section>
  );
}
