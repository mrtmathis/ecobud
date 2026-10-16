import { useTranslation } from 'react-i18next';
import { formatCents, formatMonth } from '../format.js';

// Result of a finished month, drawn like the dashboard block of each theme
export default function RecapHero({ recap, month, skin }) {
  const { t } = useTranslation();

  if (recap.budgetCents === null) {
    return (
      <section className="card" aria-labelledby="result-title">
        <h2 id="result-title">{formatMonth(month)}</h2>
        <p>{t('recap.noBudget', { amount: formatCents(recap.spentCents) })}</p>
      </section>
    );
  }

  const over = recap.overCents > 0;
  const figures = {
    title: over ? t('recap.overTitle', { amount: formatCents(recap.overCents) }) : t('recap.savedTitle'),
    amount: formatCents(over ? recap.overCents : recap.savedCents),
    spent: formatCents(recap.spentCents),
    budget: formatCents(recap.budgetCents),
    badge: over ? t('dashboard.stampOver') : t('recap.badge'),
    level: over ? 100 : 0,
    // Share of the budget that was saved, for the jar
    savedShare: over ? 0 : Math.round((recap.savedCents / recap.budgetCents) * 100),
    month: formatMonth(month),
    over,
  };

  if (skin === 'bocal') return <JarRecap {...figures} />;
  if (skin === 'pop') return <PopRecap {...figures} />;
  return <TicketRecap {...figures} />;
}

function TicketRecap({ title, amount, spent, budget, badge, level, month, over }) {
  const { t } = useTranslation();
  return (
    <section className="hero hero-ticket" aria-labelledby="result-title">
      <div className="receipt">
        <div className="receipt-head">
          <span className="receipt-shop">EcoBud</span>
          <span className="receipt-meta">{month}</span>
        </div>
        <div className="receipt-row tnum">
          <span>{t('dashboard.budgetLabel')}</span>
          <span className="dots" />
          <span>{budget}</span>
        </div>
        <div className="receipt-row tnum">
          <span>{t('dashboard.spentLabel')}</span>
          <span className="dots" />
          <span>−{spent}</span>
        </div>
        <div className="receipt-total">
          <h2 id="result-title" className="hero-label">
            {title}
          </h2>
          <p className="hero-amount tnum">
            <mark>
              {over ? '−' : ''}
              {amount}
            </mark>
          </p>
        </div>
        <span className="stamp" data-level={level}>
          {badge}
        </span>
        <div className="barcode" aria-hidden="true" />
      </div>
    </section>
  );
}

function JarRecap({ title, amount, spent, budget, badge, level, savedShare, over }) {
  const { t } = useTranslation();
  return (
    <section className="hero hero-jar card" aria-labelledby="result-title" data-level={level}>
      <div className="jar" aria-hidden="true">
        <span className="jar-shine" />
        <div className="jar-water" style={{ '--level': `${savedShare}%` }}>
          <svg className="jar-wave" viewBox="0 0 200 16" preserveAspectRatio="none">
            <path d="M0 8 Q12.5 0 25 8 T50 8 T75 8 T100 8 T125 8 T150 8 T175 8 T200 8 V16 H0Z" />
          </svg>
          <span className="bubble" />
          <span className="bubble" />
          <span className="bubble" />
        </div>
      </div>
      <div className="jar-text">
        <h2 id="result-title" className="hero-label">
          {title}
        </h2>
        <p className="hero-amount tnum">
          {over ? '−' : ''}
          {amount}
        </p>
        <p className="hero-sub tnum">{t('recap.spentOfBudget', { spent, budget })}</p>
        <span className="pill" data-level={level}>
          <i aria-hidden="true" />
          {badge}
        </span>
      </div>
    </section>
  );
}

function PopRecap({ title, amount, spent, budget, badge, level, over }) {
  const { t } = useTranslation();
  return (
    <section className="hero hero-pop" aria-labelledby="result-title" data-level={level}>
      <span className="sticker" data-level={level}>
        {badge}
      </span>
      <h2 id="result-title" className="hero-label">
        {title}
      </h2>
      <p className="hero-amount tnum">
        {over ? '−' : ''}
        {amount}
      </p>
      <p className="hero-sub tnum">{t('recap.spentOfBudget', { spent, budget })}</p>
    </section>
  );
}
