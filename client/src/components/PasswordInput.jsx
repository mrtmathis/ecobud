import { useState } from 'react';

// Password field with a button to show or hide what was typed
export default function PasswordInput({ id, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <span>
      <input id={id} type={visible ? 'text' : 'password'} autoCapitalize="none" spellCheck={false} {...props} />{' '}
      <button
        type="button"
        aria-controls={id}
        aria-pressed={visible}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        onClick={() => setVisible(!visible)}
      >
        {visible ? 'Masquer' : 'Afficher'}
      </button>
    </span>
  );
}
