import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n.js';
import './pwa.js';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
