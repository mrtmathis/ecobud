import { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Password field with a button to show or hide what was typed
export default function PasswordInput({ id, ...props }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <span>
      <input id={id} type={visible ? 'text' : 'password'} autoCapitalize="none" spellCheck={false} {...props} />{' '}
      <button
        type="button"
        aria-controls={id}
        aria-pressed={visible}
        aria-label={visible ? t('password.hideLabel') : t('password.showLabel')}
        onClick={() => setVisible(!visible)}
      >
        {visible ? t('password.hide') : t('password.show')}
      </button>
    </span>
  );
}
