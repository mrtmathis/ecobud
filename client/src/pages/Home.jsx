import { Link } from 'react-router';

export default function Home() {
  return (
    <main>
      <h1>EcoBud</h1>
      <p>Ton budget étudiant, sans prise de tête.</p>
      <p>
        Note tes dépenses en quelques secondes, fixe ton budget du mois et vois ce qu’il te reste.
        Aucune donnée bancaire demandée.
      </p>
      <p>
        <Link to="/register">Créer un compte</Link> · <Link to="/login">Se connecter</Link>
      </p>
    </main>
  );
}
