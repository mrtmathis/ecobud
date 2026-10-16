import { useState } from 'react';

// Shows a recovery code once; the user must confirm they saved it before continuing
export default function RecoveryCode({ code, onDone }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
  };

  const download = () => {
    const text = `Code de récupération EcoBud\n\n${code}\n\nGarde-le en lieu sûr. Il permet de changer ton mot de passe si tu l'oublies.\n`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    link.download = 'ecobud-code-de-recuperation.txt';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <section aria-labelledby="recovery-title">
      <h2 id="recovery-title">Ton code de récupération</h2>
      <p>
        Si tu oublies ton mot de passe, ce code est <strong>le seul moyen</strong> de récupérer ton compte. Il ne
        sera plus jamais affiché : note-le ou télécharge-le maintenant.
      </p>
      <p>
        <code style={{ fontSize: '1.4em' }}>{code}</code>
      </p>
      <p>
        <button type="button" onClick={copy}>
          {copied ? 'Copié' : 'Copier'}
        </button>{' '}
        <button type="button" onClick={download}>
          Télécharger
        </button>
      </p>
      <p>
        <input id="saved" type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />{' '}
        <label htmlFor="saved">J’ai noté mon code en lieu sûr</label>
      </p>
      <button type="button" disabled={!saved} onClick={onDone}>
        Continuer
      </button>
    </section>
  );
}
