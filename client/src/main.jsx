import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/theme-picker.css';
import './styles/dashboard.css';
import './styles/pages.css';
import './theme.js';
import './i18n.js';
import './pwa.js';
import './zoom.js';
import App from './App.jsx';

// Safari on iPhone ignores the viewport setting, so the pinch gesture itself is cancelled
// (touch screens only: a Mac trackpad keeps its pinch zoom)
if (navigator.maxTouchPoints > 0) {
  for (const gesture of ['gesturestart', 'gesturechange']) {
    document.addEventListener(gesture, (event) => event.preventDefault(), { passive: false });
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
