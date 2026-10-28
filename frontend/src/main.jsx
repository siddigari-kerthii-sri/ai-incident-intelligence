
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

const STORAGE_KEY = 'incident-triage-settings';

// Apply the saved theme before the app renders.
try {
  const saved = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || '{}'
  );

  const appearance = saved.appearance === 'dark' ? 'dark' : 'light';

  document.documentElement.classList.toggle(
    'dark',
    appearance === 'dark'
  );

  document.documentElement.style.colorScheme = appearance;
} catch {
  document.documentElement.classList.remove('dark');
  document.documentElement.style.colorScheme = 'light';
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
