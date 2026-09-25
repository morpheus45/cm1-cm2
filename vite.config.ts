import { createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';

const BASE = '/cm1-cm2/';

/**
 * Écrit `sw.js` à la fin du build, avec la liste réelle des fichiers produits.
 *
 * Les noms des fichiers construits portent une empreinte qui change à chaque
 * build : c'est cette liste qui donne son nom au cache, donc une nouvelle
 * version remplace l'ancienne au lieu de s'y ajouter.
 */
function serviceWorker(base: string): Plugin {
  return {
    name: 'exercices-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      // `index.html` n'est pas encore dans le bundle à ce stade du build :
      // on l'ajoute à la main, avec les fichiers recopiés depuis public/.
      const built = Object.keys(bundle);
      const fromPublic = readdirSync('public');
      const assets = [...new Set([...built, ...fromPublic, 'index.html'])]
        .filter((name) => name !== 'sw.js')
        .sort()
        .map((name) => base + name);
      const urls = [base, ...assets];
      const version = createHash('sha256').update(urls.join('\n')).digest('hex').slice(0, 12);

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: renderServiceWorker({ base, version, urls }),
      });
    },
  };
}

function renderServiceWorker({
  base,
  version,
  urls,
}: {
  base: string;
  version: string;
  urls: string[];
}): string {
  return `// Généré par vite.config.ts — ne pas modifier à la main.
const CACHE = 'exercices-cm1-cm2-${version}';
const INDEX = '${base}';
const ASSETS = ${JSON.stringify(urls, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// L'option « ignoreVary » est indispensable : le serveur renvoie un en-tête
// « Vary », et sans elle une requête faite par la page (qui porte un en-tête
// « Origin ») ne retrouve pas le fichier mis en cache au moment de
// l'installation, qui lui n'en portait pas. Le mode hors ligne échouait
// silencieusement à cause de cela.
const MATCH = { ignoreVary: true };

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  // Une navigation passe d'abord par le réseau : l'enfant qui ouvre
  // l'application en ligne reçoit toujours la dernière version. Hors ligne,
  // la page mise en cache prend le relais.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(INDEX, MATCH)));
    return;
  }

  // Les autres fichiers portent une empreinte dans leur nom : le cache fait
  // foi, et un nom inconnu part sur le réseau.
  event.respondWith(caches.match(request, MATCH).then((hit) => hit || fetch(request)));
});
`;
}

export default defineConfig({
  base: BASE,
  plugins: [react(), serviceWorker(BASE)],
  test: {
    environment: 'node',
  },
});
