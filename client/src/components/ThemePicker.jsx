import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { APPEARANCES, SKINS, loadFonts } from '../theme.js';

// Three live previews (each card wears its own theme) and the light or dark choice
export default function ThemePicker({ value, onChange }) {
  const { t } = useTranslation();

  // The previews need every theme's fonts
  useEffect(() => SKINS.forEach(loadFonts), []);

  return (
    <div className="theme-picker">
      <fieldset className="skin-list">
        <legend>{t('theme.skinLabel')}</legend>
        {SKINS.map((skin) => (
          <label key={skin} className="skin-card" data-skin={skin} data-mode={value.appearance}>
            <input
              type="radio"
              name="skin"
              value={skin}
              checked={value.skin === skin}
              onChange={() => onChange({ ...value, skin })}
            />
            <span className="skin-preview" aria-hidden="true">
              <span className="skin-preview-card">
                <span className="skin-preview-label">{t('dashboard.remainingTitle')}</span>
                <span className="skin-preview-num">312,40 €</span>
                <span className="skin-preview-bar">
                  <i />
                </span>
              </span>
              <span className="skin-dots">
                <i style={{ background: 'var(--c1)' }} />
                <i style={{ background: 'var(--c2)' }} />
                <i style={{ background: 'var(--c3)' }} />
                <i style={{ background: 'var(--c4)' }} />
              </span>
            </span>
            <span className="skin-name">{t(`theme.skins.${skin}.name`)}</span>
            <span className="skin-desc">{t(`theme.skins.${skin}.desc`)}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="mode-switch">
        <legend>{t('theme.modeLabel')}</legend>
        {APPEARANCES.map((appearance) => (
          <label key={appearance}>
            <input
              type="radio"
              name="appearance"
              value={appearance}
              checked={value.appearance === appearance}
              onChange={() => onChange({ ...value, appearance })}
            />
            <span>{t(`theme.modes.${appearance}`)}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
