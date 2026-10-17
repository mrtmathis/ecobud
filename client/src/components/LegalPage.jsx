import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

// Shared layout of the legal notice and privacy pages: title, update date, then titled sections
export default function LegalPage({ title, sections }) {
  const { t } = useTranslation();
  return (
    <main className="legal">
      <h1>{title}</h1>
      <p className="empty">{t('legal.updated')}</p>
      {sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          {section.text.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
          {section.list && (
            <ul>
              {section.list.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
      <p className="legal-links">
        <Link to="/">{t('notFound.back')}</Link>
      </p>
    </main>
  );
}
