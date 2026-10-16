import { useEffect, useState } from 'react';

export default function App() {
  const [apiStatus, setApiStatus] = useState('checking');

  // Shows whether the front end can reach the API
  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => setApiStatus(data.status === 'ok' ? 'online' : 'offline'))
      .catch(() => setApiStatus('offline'));
  }, []);

  const labels = { checking: 'vérification…', online: 'en ligne', offline: 'hors ligne' };

  return (
    <main>
      <h1>EcoBud</h1>
      <p>Ton budget étudiant, sans prise de tête.</p>
      <p>Application en cours de développement.</p>
      <p>État de l'API : {labels[apiStatus]}</p>
    </main>
  );
}
