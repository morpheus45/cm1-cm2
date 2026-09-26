import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// Les polices sont dans l'application elle-même : elles restent là hors
// connexion, et aucune requête ne part vers un service tiers.
import '@fontsource/andika/latin-400.css';
import '@fontsource/andika/latin-700.css';
import '@fontsource/playwrite-fr-moderne/latin-400.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Le service worker met l'application en cache : une fois ouverte, elle
// fonctionne sans connexion. Il n'existe qu'au build, pas en développement.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Pas de service worker (navigateur ancien, page non sécurisée) :
      // l'application marche quand même, simplement sans mode hors ligne.
    });
  });
}
